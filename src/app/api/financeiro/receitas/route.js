import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ======================================================
   CONSTANTES DE DOMÍNIO
====================================================== */

const TIPOS_AUTOMATICOS = ["receita_aluguel"];

const TIPOS_MANUAIS = [
  "receita_venda_imovel",
  "taxa_adm_imobiliaria",
  "outra_receita",
  "receita_aluguel",
  "multa",
  "juros",
  "correcao_monetaria",
  "taxa_contrato",
];

/* ✅ módulos permitidos no sistema */
const MODULOS_PERMITIDOS = ["COMUM", "ALUGUEL"];

/* ======================================================
   HELPERS
====================================================== */

function calcularDataVencimento(competencia, diaVencimento) {
  const [ano, mes] = competencia.split("-");
  const dia = Math.min(Number(diaVencimento), 28);
  return `${ano}-${mes}-${String(dia).padStart(2, "0")}`;
}

async function atualizarAtrasos(supabase) {
  const hoje = new Date().toISOString().split("T")[0];

  await supabase
    .from("transacoes")
    .update({ status: "atrasado" })
    .eq("natureza", "entrada")
    .eq("status", "pendente")
    .lt("data_vencimento", hoje);
}

/* ✅ resolve módulo via querystring */
function resolverModulo(url) {
  const { searchParams } = new URL(url);
  const modulo = (searchParams.get("modulo") || "COMUM").toUpperCase();

  if (!MODULOS_PERMITIDOS.includes(modulo)) {
    throw new Error("Módulo financeiro inválido.");
  }

  return modulo;
}

/* ======================================================
   🔒 RESOLVER CONTRATO PELO IMÓVEL (FONTE DA VERDADE)
====================================================== */

async function resolverContratoPorImovel(supabase, imovelId) {
  if (!imovelId) return null;

  const { data: contrato, error } = await supabase
    .from("contratos")
    .select("id")
    .eq("imovel_id", imovelId)
    .eq("status", "vigente")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !contrato) {
    return null;
  }

  return contrato.id;
}

/* ======================================================
   🔄 GERAÇÃO AUTOMÁTICA — ALUGUEL (GERA TODOS OS MESES)
====================================================== */

function parseISODateOnly(dateStr) {
  // "YYYY-MM-DD" -> Date (sem timezone do JS zoar)
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatCompetenciaYYYYMM(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getAllCompetenciasEntreDatas(dataInicioISO, dataFimISO) {
  const ini = parseISODateOnly(dataInicioISO);
  const fim = parseISODateOnly(dataFimISO);

  if (!ini || !fim) return [];

  // começa no 1º dia do mês do início
  const cursor = new Date(ini.getFullYear(), ini.getMonth(), 1);
  const last = new Date(fim.getFullYear(), fim.getMonth(), 1);

  const competencias = [];
  while (cursor <= last) {
    competencias.push(formatCompetenciaYYYYMM(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return competencias;
}

async function gerarReceitasAutomaticas(supabase) {
  const hoje = new Date().toISOString().split("T")[0];

  const { data: contratos, error: contratosError } = await supabase
    .from("contratos")
    .select(`
      id,
      imovel_id,
      codigo,
      valor_acordado,
      dia_vencimento_aluguel,
      taxa_administracao_percent,
      data_inicio,
      data_fim,
      status
    `)
    .eq("tipo", "locacao")
    .eq("status", "vigente")
    .lte("data_inicio", hoje)
    .gte("data_fim", hoje)
    //  contrato já começou
    .not("dia_vencimento_aluguel", "is", null);

  if (contratosError) throw contratosError;
  if (!contratos?.length) return;

  // 1) pegar todos os aluguéis já existentes desses contratos (pra não duplicar)
  const contratoIds = contratos.map((c) => c.id);

  const { data: existentes, error: existentesError } = await supabase
    .from("transacoes")
    .select("contrato_id, dados_cobranca_json")
    .eq("tipo", "receita_aluguel")
    .eq("modulo_financeiro", "ALUGUEL")
    .in("contrato_id", contratoIds)
    .neq("status", "cancelado");

  if (existentesError) throw existentesError;

  // mapa: contrato_id -> Set(competencias já existentes)
  const existentesMap = new Map();

  for (const e of existentes || []) {
    const comp = e?.dados_cobranca_json?.competencia;
    if (!e.contrato_id || !comp) continue;

    if (!existentesMap.has(e.contrato_id)) {
      existentesMap.set(e.contrato_id, new Set());
    }
    existentesMap.get(e.contrato_id).add(comp);
  }

  // 2) montar novas transações faltantes
  const novas = [];

  for (const contrato of contratos) {
    // se não tiver data_fim, não gera lote (pra não virar infinito)
    if (!contrato.data_fim) continue;

    const competenciasContrato = getAllCompetenciasEntreDatas(
      contrato.data_inicio,
      contrato.data_fim
    );

    const setExistentes = existentesMap.get(contrato.id) || new Set();

    for (const competencia of competenciasContrato) {
      if (setExistentes.has(competencia)) continue;

      novas.push({
        contrato_id: contrato.id,
        imovel_id: contrato.imovel_id,

        tipo: "receita_aluguel",
        natureza: "entrada",
        modulo_financeiro: "ALUGUEL",
        status: "pendente",

        valor: Number(contrato.valor_acordado),

        // ✅ pai do agrupamento sempre NULL
        aluguel_base_id: null,

        data_vencimento: calcularDataVencimento(
          competencia,
          contrato.dia_vencimento_aluguel
        ),

        descricao: `Aluguel ${competencia}`,

        dados_cobranca_json: {
          origem: "automatica",
          competencia,
          dia_vencimento: contrato.dia_vencimento_aluguel,
          contrato_data_inicio: contrato.data_inicio,
          contrato_data_fim: contrato.data_fim,
          taxa_administracao_percent: contrato.taxa_administracao_percent,
        },
      });
    }
  }

  // 3) insert em lote
  if (novas.length) {
    const { error: insertError } = await supabase.from("transacoes").insert(novas);
    if (insertError) throw insertError;
  }
}

/* ======================================================
   ✅ NOVO: HELPERS PARA TAXA ADM AUTOMÁTICA
====================================================== */

async function existeTransacaoAutomatica(supabase, referenciaId, tipo, moduloFinanceiro) {
  let query = supabase
    .from("transacoes")
    .select("id")
    .eq("tipo", tipo)
    .eq("dados_cobranca_json->>referencia_id", referenciaId);

  if (moduloFinanceiro) query = query.eq("modulo_financeiro", moduloFinanceiro);

  const { data } = await query.limit(1);
  return !!data?.length;
}

async function safeInsert(supabase, payload) {
  const { error } = await supabase.from("transacoes").insert(payload);

  if (error) {
    // índice único → idempotência garantida
    if (error.code === "23505") return;
    throw error;
  }
}

/**
 * ✅ Gera automaticamente taxa_adm_imobiliaria:
 * - somente quando o aluguel "pai" (receita_aluguel) estiver PAGO
 * - taxa calculada em cima do valor base do contrato (contratos.valor_acordado)
 * - natureza = entrada (receita da imobiliária)
 */
async function gerarTaxasAdministracaoImobiliaria(supabase) {
  const { data: alugueisPagos, error } = await supabase
    .from("transacoes")
    .select(`
      id,
      contrato_id,
      imovel_id,
      valor,
      status,
      data_pagamento,
      data_vencimento,
      dados_cobranca_json,
      modulo_financeiro,
      contratos (
        id,
        valor_acordado,
        taxa_administracao_percent
      )
    `)
    .eq("tipo", "receita_aluguel")
    .eq("natureza", "entrada")
    .eq("status", "pago")
    .eq("modulo_financeiro", "ALUGUEL");

  if (error) throw error;

  for (const aluguel of alugueisPagos || []) {
    // idempotência: uma taxa por aluguel pai
    const jaExiste = await existeTransacaoAutomatica(
      supabase,
      aluguel.id,
      "taxa_adm_imobiliaria",
      "ALUGUEL"
    );
    if (jaExiste) continue;

    const contrato = aluguel?.contratos;

    const taxaPercent = Number(contrato?.taxa_administracao_percent || 0);
    if (!taxaPercent || taxaPercent <= 0) continue;

    // ✅ base de cálculo: valor base do contrato (não o valor pago)
    const base = Number(contrato?.valor_acordado || 0);
    if (!base || base <= 0) continue;

    const valorTaxa = Number(((base * taxaPercent) / 100).toFixed(2));
    if (valorTaxa <= 0) continue;

    const competencia = aluguel?.dados_cobranca_json?.competencia || null;

    // ✅ taxa nasce como PAGA no mesmo dia do aluguel pago
    const dataPagamento = aluguel.data_pagamento || new Date().toISOString().split("T")[0];
    const dataVencimento = aluguel.data_pagamento || aluguel.data_vencimento || dataPagamento;

    await safeInsert(supabase, {
      tipo: "taxa_adm_imobiliaria",
      natureza: "entrada",
      modulo_financeiro: "ALUGUEL",
      status: "pago",

      valor: valorTaxa,
      descricao: `Taxa de administração (${taxaPercent}%)`,

      contrato_id: aluguel.contrato_id,
      imovel_id: aluguel.imovel_id,
      aluguel_base_id: null,
      data_vencimento: dataVencimento,
      data_pagamento: dataPagamento,

      dados_cobranca_json: {
        origem: "automatica",
        referencia_id: aluguel.id,
        competencia,
        taxa_administracao_percent: taxaPercent,
        base_calculo: "contrato.valor_acordado",
        valor_base_contrato: base,
      },
    });
  }
}

/* ======================================================
   GET — LISTAGEM + GERAÇÃO AUTOMÁTICA
====================================================== */

export async function GET(req) {
  const supabase = createServiceClient();

  try {
    const modulo = resolverModulo(req.url);

    await atualizarAtrasos(supabase);

    // ✅ só gera automáticas quando o módulo for ALUGUEL
    if (modulo === "ALUGUEL") {
      await gerarReceitasAutomaticas(supabase);

      // ✅ NOVO: gera taxa automática quando aluguel for pago
      await gerarTaxasAdministracaoImobiliaria(supabase);
    }

    const { data, error } = await supabase
      .from("transacoes")
      .select(`
        id,
        aluguel_base_id,
        contrato_id,
        imovel_id,
        tipo,
        natureza,
        modulo_financeiro,
        status,
        valor,
        descricao,
        data_vencimento,
        data_pagamento,
        dados_cobranca_json,
        created_at,

        imovel:imoveis(codigo_ref, titulo),

        contrato:contratos(
          id,
          codigo,
          proprietario:proprietario_id(nome),
          inquilino:inquilino_id(nome)
        )
      `)
      .eq("natureza", "entrada")
      .eq("modulo_financeiro", modulo)
      .neq("tipo", "taxa_adm_imobiliaria")
      .order("data_vencimento", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Receitas GET:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ======================================================
   POST — RECEITA MANUAL (CONTRATO RESOLVIDO NO BACKEND)
====================================================== */

export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();

    // ✅ valida e resolve módulo vindo do front
    const modulo = (body.modulo_financeiro || "COMUM").toUpperCase();
    if (!MODULOS_PERMITIDOS.includes(modulo)) {
      return NextResponse.json(
        { error: "Módulo financeiro inválido." },
        { status: 400 }
      );
    }

    if (TIPOS_AUTOMATICOS.includes(body.tipo)) {
      return NextResponse.json(
        { error: "Receita automática não pode ser criada manualmente." },
        { status: 403 }
      );
    }

    if (!TIPOS_MANUAIS.includes(body.tipo)) {
      return NextResponse.json({ error: "Tipo de receita inválido." }, { status: 400 });
    }

    // 🔒 contrato é resolvido pelo imóvel (se existir imovel_id)
    // 🔒 contrato é resolvido pelo imóvel (se existir imovel_id)
    const contratoId = await resolverContratoPorImovel(supabase, body.imovel_id);

    // ✅ só exige contrato se for módulo ALUGUEL
    if (modulo === "ALUGUEL" && body.imovel_id && !contratoId) {
      return NextResponse.json(
        { error: "Nenhum contrato vigente encontrado para este imóvel." },
        { status: 409 }
      );
    }

    const payload = {
      tipo: body.tipo,
      natureza: "entrada",
      modulo_financeiro: modulo,
      status: "pendente",
      valor: body.valor,
      imovel_id: body.imovel_id || null,
      contrato_id: contratoId || body.contrato_id || null,
      data_vencimento: body.data_vencimento,
      descricao: body.descricao,
      dados_cobranca_json: {
        ...body.dados_cobranca_json,
        origem: "manual",
      },
    };

    const { data, error } = await supabase
      .from("transacoes")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Receitas POST:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ======================================================
   PUT — ATUALIZAÇÃO GOVERNADA (STATUS ONLY)
====================================================== */

export async function PUT(req) {
  const supabase = createServiceClient();

  try {
    const { id, status, data_pagamento } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID e status são obrigatórios." },
        { status: 400 }
      );
    }

    const { data: atual } = await supabase
      .from("transacoes")
      .select("status, dados_cobranca_json")
      .eq("id", id)
      .single();

    if (!atual) {
      return NextResponse.json({ error: "Receita não encontrada." }, { status: 404 });
    }

    const origem = atual.dados_cobranca_json?.origem;

    if (origem === "automatica" && status === "cancelado") {
      return NextResponse.json(
        { error: "Receita automática não pode ser cancelada." },
        { status: 409 }
      );
    }

    if (atual.status === "pago") {
      return NextResponse.json({ error: "Receita paga é imutável." }, { status: 403 });
    }

    const updates = {
      status,
      updated_at: new Date().toISOString(),
      data_pagamento:
        status === "pago"
          ? data_pagamento || new Date().toISOString().split("T")[0]
          : null,
    };

    // ✅ se essa transação é um aluguel pai e virou "pago", paga os filhos também
    if (status === "pago") {
      const { data: transacao } = await supabase
        .from("transacoes")
        .select("id, tipo, modulo_financeiro")
        .eq("id", id)
        .single();

      const ehAluguelPai =
        transacao?.tipo === "receita_aluguel" &&
        transacao?.modulo_financeiro === "ALUGUEL";

      if (ehAluguelPai) {
        const hojePag = data_pagamento || new Date().toISOString().split("T")[0];

        await supabase
          .from("transacoes")
          .update({
            status: "pago",
            data_pagamento: hojePag,
            updated_at: new Date().toISOString(),
          })
          .eq("aluguel_base_id", id)
          .in("status", ["pendente", "atrasado"]);
      }
    }

    const { data, error } = await supabase
      .from("transacoes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Receitas PUT:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ======================================================
   DELETE — BLOQUEADO
====================================================== */

export async function DELETE() {
  return NextResponse.json(
    { error: "Exclusão não permitida. Use status 'cancelado'." },
    { status: 403 }
  );
}
