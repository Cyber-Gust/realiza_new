import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ======================================================
   CONSTANTES / DOMÍNIO
====================================================== */

const MODULO_PADRAO = "ALUGUEL";

// valida enum do banco (o que você mostrou)
const TIPOS_ENUM_PERMITIDOS = [
  "receita_aluguel",
  "receita_venda_imovel",
  "taxa_adm_imobiliaria",
  "repasse_proprietario",
  "comissao_corretor",
  "despesa_manutencao",
  "pagamento_iptu",
  "pagamento_condominio",
  "taxa_contrato",
  "multa",
  "juros",
  "condominio",
  "consumo_agua",
  "consumo_luz",
  "desconto_aluguel",
  "fundo_reserva",
  "gas",
  "iptu",
  "manutencao",
  "outros",
  "rescisao",
  "seguro_fianca",
  "seguro_incendio",
  "taxa",
  "boleto",
];

// status do enum
const STATUS_PADRAO = "pago";

// natureza no DB: entrada | saida
function resolverNatureza(natureza_texto) {
  if (natureza_texto === "credito") return "entrada";
  if (natureza_texto === "debito") return "saida";
  return null;
}

/* ======================================================
   HELPERS
====================================================== */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toNumberBR(value) {
  if (value == null) return NaN;
  const raw = String(value).trim().replace(".", "").replace(",", ".");
  const n = Number(raw);
  return n;
}

function isoToCompetenciaYYYYMM(isoDate) {
  // "YYYY-MM-DD" -> "YYYY-MM"
  if (!isoDate) return null;
  const [y, m] = String(isoDate).split("-");
  if (!y || !m) return null;
  return `${y}-${m}`;
}

async function buscarAluguelBaseId(supabase, contratoId, competenciaYYYYMM) {
  const { data, error } = await supabase
    .from("transacoes")
    .select("id")
    .eq("contrato_id", contratoId)
    .eq("tipo", "receita_aluguel")
    .eq("modulo_financeiro", "ALUGUEL")
    .eq("dados_cobranca_json->>competencia", competenciaYYYYMM)
    .neq("status", "cancelado")
    .limit(1)
    .single();

  if (error) return null;
  return data?.id || null;
}

function monthYearToISO(competencia, dia = 5) {
  // "MM/YYYY" -> "YYYY-MM-DD"
  const [mm, yyyy] = String(competencia || "").split("/");
  const month = Number(mm);
  const year = Number(yyyy);

  if (!month || !year) return null;

  const dt = new Date(year, month - 1, dia);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function addMonthsISO(isoDate, add) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setMonth(dt.getMonth() + add);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function buildParcelas({ totalValor, qtdParcelas, inicioCompetencia, dividirValor, valorCheio }) {
  const qtd = Number(qtdParcelas);
  if (!qtd || qtd < 2) return [];

  const inicioISO = monthYearToISO(inicioCompetencia, 5);
  if (!inicioISO) return [];

  if (!Number.isFinite(totalValor) || totalValor <= 0) return [];

  const parcelas = [];

  if (dividirValor) {
    const base = totalValor / qtd;
    for (let i = 0; i < qtd; i++) {
      parcelas.push({
        numero: i + 1,
        data_vencimento: addMonthsISO(inicioISO, i),
        valor: Number(base.toFixed(2)),
      });
    }
    return parcelas;
  }

  if (valorCheio) {
    for (let i = 0; i < qtd; i++) {
      parcelas.push({
        numero: i + 1,
        data_vencimento: addMonthsISO(inicioISO, i),
        valor: Number(totalValor.toFixed(2)),
      });
    }
    return parcelas;
  }

  // fallback: se não vier nada marcado, divide
  const base = totalValor / qtd;
  for (let i = 0; i < qtd; i++) {
    parcelas.push({
      numero: i + 1,
      data_vencimento: addMonthsISO(inicioISO, i),
      valor: Number(base.toFixed(2)),
    });
  }
  return parcelas;
}

async function buscarContrato(supabase, contratoId) {
  if (!contratoId) return null;

  const { data, error } = await supabase
    .from("contratos")
    .select("id, imovel_id, proprietario_id, inquilino_id, status, dia_vencimento_aluguel")
    .eq("id", contratoId)
    .single();

  if (error) return null;
  return data;
}

/* ======================================================
   POST — CRIAR LANÇAMENTO (ÚNICO / FIXO / PARCELAS)
====================================================== */

export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();

    // ----------------------------
    // validação básica
    // ----------------------------
    if (!body.contrato_id) {
      return NextResponse.json({ error: "contrato_id é obrigatório." }, { status: 400 });
    }

    const contrato = await buscarContrato(supabase, body.contrato_id);
    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    // (você pode travar somente vigente se quiser)
    // se quiser ser mais permissivo, remove isso:
    if (!["vigente", "reajuste_pendente", "renovacao_pendente"].includes(contrato.status)) {
      return NextResponse.json(
        { error: "Contrato não está elegível para lançamentos (não vigente)." },
        { status: 409 }
      );
    }

    if (!body.tipo_lancamento_texto) {
      return NextResponse.json({ error: "tipo_lancamento_texto é obrigatório." }, { status: 400 });
    }

    if (!body.natureza_texto) {
      return NextResponse.json({ error: "natureza_texto é obrigatório." }, { status: 400 });
    }

    const natureza = resolverNatureza(body.natureza_texto);
    if (!natureza) {
      return NextResponse.json(
        { error: "natureza_texto inválida. Use 'debito' ou 'credito'." },
        { status: 400 }
      );
    }

    if (!body.descricao || String(body.descricao).trim().length < 2) {
      return NextResponse.json({ error: "Descrição é obrigatória." }, { status: 400 });
    }

    // valor_total pode vir number ou string
    const valorTotal = Number(body.valor_total);
    if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
      return NextResponse.json({ error: "valor_total inválido." }, { status: 400 });
    }

    if (!body.competencia) {
      return NextResponse.json({ error: "competencia é obrigatória (MM/YYYY)." }, { status: 400 });
    }

    const recorrencia = body.recorrencia || "unico";
    if (!["unico", "fixo", "parcelas"].includes(recorrencia)) {
      return NextResponse.json({ error: "recorrencia inválida." }, { status: 400 });
    }

    // ----------------------------
    // resolver tipo enum do banco
    // ----------------------------
    const tipoEnum = body.tipo_lancamento_texto;

    if (!tipoEnum) {
    return NextResponse.json(
        { error: "tipo_lancamento_texto é obrigatório." },
        { status: 400 }
    );
    }

    if (!TIPOS_ENUM_PERMITIDOS.includes(tipoEnum)) {
      return NextResponse.json(
        { error: `Tipo enum '${tipoEnum}' não permitido no sistema.` },
        { status: 400 }
      );
    }

    // ----------------------------
    // definir vencimento
    // ----------------------------
    // regra: sempre dia 5 (ou você pode usar contrato.dia_vencimento_aluguel)
    const diaVencimento = Math.min(Number(contrato.dia_vencimento_aluguel || 5), 28);
    const dataVencimentoBase = monthYearToISO(body.competencia, diaVencimento);

    if (!dataVencimentoBase) {
      return NextResponse.json({ error: "competencia inválida (formato MM/YYYY)." }, { status: 400 });
    }

    // ----------------------------
    // gerar payload(s)
    // ----------------------------
    const common = {
      contrato_id: contrato.id,
      imovel_id: contrato.imovel_id || body.imovel_id || null,
      // opcional: profile_id se você quiser quem criou
      profile_id: body.profile_id || null,

      tipo: tipoEnum,
      natureza,
      modulo_financeiro: MODULO_PADRAO,
      status: STATUS_PADRAO,

      aluguel_base_id: null,

      descricao: String(body.descricao).trim(),
      data_pagamento: null,
      created_at: new Date().toISOString(),
    };

    let rowsToInsert = [];

    // ✅ 1) ÚNICO
    if (recorrencia === "unico") {
      const competenciaYYYYMM = isoToCompetenciaYYYYMM(dataVencimentoBase);
      const aluguelBaseId = await buscarAluguelBaseId(supabase, contrato.id, competenciaYYYYMM);

      rowsToInsert = [
        {
          ...common,
          aluguel_base_id: aluguelBaseId,
          valor: Number(valorTotal.toFixed(2)),
          data_vencimento: dataVencimentoBase,
          dados_cobranca_json: {
            origem: "manual_lancamento",
            competencia: competenciaYYYYMM,
            recorrencia: "unico",
            tipo_lancamento_texto: body.tipo_lancamento_texto,
            natureza_texto: body.natureza_texto,
            locador_id: body.locador_id || null,
          },
        },
      ];
    }

    // ✅ 2) FIXO
    // ⚠️ FIXO DE VERDADE precisa de job/cron gerar mês a mês
    // aqui eu registro só 1 transação e marco como fixa no JSON
    if (recorrencia === "fixo") {
      const competenciaYYYYMM = isoToCompetenciaYYYYMM(dataVencimentoBase);
      const aluguelBaseId = await buscarAluguelBaseId(supabase, contrato.id, competenciaYYYYMM);

      rowsToInsert = [
        {
          ...common,
          aluguel_base_id: aluguelBaseId,
          valor: Number(valorTotal.toFixed(2)),
          data_vencimento: dataVencimentoBase,
          dados_cobranca_json: {
            origem: "manual_lancamento",
            competencia: competenciaYYYYMM,
            recorrencia: "fixo",
            fixo: true,
            tipo_lancamento_texto: body.tipo_lancamento_texto,
            natureza_texto: body.natureza_texto,
            locador_id: body.locador_id || null,
          },
        },
      ];
    }

    // ✅ 3) PARCELAS
    if (recorrencia === "parcelas") {
      const qtdParcelas = Number(body.qtd_parcelas);
      if (!qtdParcelas || qtdParcelas < 2 || qtdParcelas > 120) {
        return NextResponse.json(
          { error: "qtd_parcelas inválida. Deve ser entre 2 e 120." },
          { status: 400 }
        );
      }

      const inicioParcelas = body.inicio_parcelas || body.competencia;
      if (!inicioParcelas) {
        return NextResponse.json(
          { error: "inicio_parcelas é obrigatório para parcelas." },
          { status: 400 }
        );
      }

      const dividirValor = !!body.dividir_valor;
      const valorCheio = !!body.valor_cheio_cada_parcela;

      if (dividirValor && valorCheio) {
        return NextResponse.json(
          { error: "Escolha somente UMA opção: dividir_valor OU valor_cheio_cada_parcela." },
          { status: 400 }
        );
      }

      if (!dividirValor && !valorCheio) {
        return NextResponse.json(
          { error: "Selecione dividir_valor ou valor_cheio_cada_parcela." },
          { status: 400 }
        );
      }

      const parcelasGeradas = buildParcelas({
        totalValor: Number(valorTotal),
        qtdParcelas,
        inicioCompetencia: inicioParcelas,
        dividirValor,
        valorCheio,
      });

      if (!parcelasGeradas.length) {
        return NextResponse.json(
          { error: "Não foi possível gerar parcelas. Verifique os campos." },
          { status: 400 }
        );
      }

      // opcional: cria um id lógico para amarrar as parcelas no mesmo grupo
      const grupoId = crypto.randomUUID();

      rowsToInsert = [];

      for (const p of parcelasGeradas) {
        const competenciaYYYYMM = isoToCompetenciaYYYYMM(p.data_vencimento);
        const aluguelBaseId = await buscarAluguelBaseId(supabase, contrato.id, competenciaYYYYMM);

        rowsToInsert.push({
          ...common,
          aluguel_base_id: aluguelBaseId,
          valor: Number(p.valor.toFixed(2)),
          data_vencimento: p.data_vencimento,
          dados_cobranca_json: {
            origem: "manual_lancamento",
            grupo_lancamento_id: grupoId,
            recorrencia: "parcelas",

            competencia: competenciaYYYYMM,

            competencia_inicio: inicioParcelas,
            qtd_parcelas: qtdParcelas,
            parcela_numero: p.numero,
            dividir_valor: dividirValor,
            valor_cheio_cada_parcela: valorCheio,
            tipo_lancamento_texto: body.tipo_lancamento_texto,
            natureza_texto: body.natureza_texto,
            locador_id: body.locador_id || null,
          },
        });
      }
    }

    if (!rowsToInsert.length) {
      return NextResponse.json(
        { error: "Nenhuma transação foi gerada para inserção." },
        { status: 400 }
      );
    }

    // ----------------------------
    // INSERT
    // ----------------------------
    const { data, error } = await supabase
      .from("transacoes")
      .insert(rowsToInsert)
      .select(`
        id,
        contrato_id,
        imovel_id,
        tipo,
        natureza,
        modulo_financeiro,
        status,
        descricao,
        valor,
        data_vencimento,
        dados_cobranca_json,
        created_at
      `);

    if (error) throw error;

    return NextResponse.json({
      data,
      meta: {
        total_inseridas: data?.length || 0,
        recorrencia,
      },
    });
  } catch (err) {
    console.error("❌ Lancamentos POST:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ======================================================
   DELETE — BLOQUEADO (governado por status)
====================================================== */

export async function DELETE() {
  return NextResponse.json(
    { error: "Exclusão não permitida. Use status 'cancelado'." },
    { status: 403 }
  );
}
