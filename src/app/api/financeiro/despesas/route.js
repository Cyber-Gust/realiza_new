import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ======================================================
   CONSTANTES DE DOMÍNIO
====================================================== */

const TIPOS_DESPESA_AUTOMATICA = [
  "repasse_proprietario",

];

const TIPOS_DESPESA_MANUAL = [
  "despesa_operacional",
  "despesa_manutencao",
  "seguro_incendio",
  "pagamento_condominio",
  "pagamento_iptu",
  "comissao_corretor",
  "consumo_luz",
  "taxa",
  "outros",
];

/* ✅ módulos permitidos no sistema */
const MODULOS_PERMITIDOS = ["COMUM", "ALUGUEL"];

/* ======================================================
   HELPERS
====================================================== */

function resolverModulo(url) {
  const { searchParams } = new URL(url);
  const modulo = (searchParams.get("modulo") || "COMUM").toUpperCase();

  if (!MODULOS_PERMITIDOS.includes(modulo)) {
    throw new Error("Módulo financeiro inválido.");
  }

  return modulo;
}

async function atualizarAtrasos(supabase) {
  const hoje = new Date().toISOString().split("T")[0];

  await supabase
    .from("transacoes")
    .update({ status: "atrasado" })
    .eq("natureza", "saida")
    .eq("status", "pendente")
    .lt("data_vencimento", hoje);
}

async function existeDespesaAutomatica(
  supabase,
  referenciaId,
  tipo,
  profileId = null,
  moduloFinanceiro = null
) {
  let query = supabase
    .from("transacoes")
    .select("id")
    .eq("tipo", tipo)
    .eq("dados_cobranca_json->>referencia_id", referenciaId);

  if (profileId) query = query.eq("profile_id", profileId);
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

/* ======================================================
   ✅ NOVO: SOMATÓRIO DO ALUGUEL PAGO (PAI + FILHOS)
====================================================== */

/**
 * Regra:
 * - aluguel pai = receita_aluguel (id = aluguelPaiId)
 * - filhos = transações vinculadas com aluguel_base_id = aluguelPaiId
 *
 * Aqui eu somo TODOS os filhos com status != cancelado.
 * Porque no seu modelo, filho é "ajuste de boleto", não necessariamente "pagamento".
 */
async function calcularTotalPagoAluguel(supabase, aluguelPaiId) {
  if (!aluguelPaiId) return 0;

  // pega o pai
  const { data: pai, error: errPai } = await supabase
    .from("transacoes")
    .select("id, valor")
    .eq("id", aluguelPaiId)
    .single();

  if (errPai || !pai) return 0;

  const valorPai = Number(pai.valor || 0);

  // pega filhos
  const { data: filhos, error: errFilhos } = await supabase
    .from("transacoes")
    .select("id, valor, status, tipo, natureza")
    .eq("aluguel_base_id", aluguelPaiId)
    .neq("status", "cancelado");

  if (errFilhos) throw errFilhos;

  const somaFilhos = (filhos || []).reduce((sum, t) => {
    const valor = Number(t.valor || 0);

    if (t.natureza === "entrada") return sum + valor;
    if (t.natureza === "saida") return sum - valor;

    return sum;
  }, 0);

  return Number((valorPai + somaFilhos).toFixed(2));
}


/* ======================================================
   🔄 GERAÇÃO AUTOMÁTICA — REPASSE PROPRIETÁRIO (ALUGUEL)
====================================================== */

async function gerarRepasseProprietario(supabase) {
  const { data: receitas, error } = await supabase
    .from("transacoes")
    .select(`
      id,
      valor,
      contrato_id,
      imovel_id,
      data_pagamento,
      dados_cobranca_json,
      modulo_financeiro,
      contratos (
        id,
        valor_acordado,
        taxa_administracao_percent
      )
    `)
    .eq("tipo", "receita_aluguel")
    .eq("status", "pago")
    .eq("modulo_financeiro", "ALUGUEL");

  if (error) throw error;

  for (const r of receitas || []) {
    const jaExiste = await existeDespesaAutomatica(
      supabase,
      r.id,
      "repasse_proprietario",
      null,
      "ALUGUEL"
    );
    if (jaExiste) continue;

    // ✅ total pago do mês = pai + filhos
    const totalPago = await calcularTotalPagoAluguel(supabase, r.id);

    // ✅ taxa deve ser calculada pelo valor base do contrato (não pelo pago)
    const contrato = r?.contratos;

    const taxaPercent = Number(
      contrato?.taxa_administracao_percent ??
        r.dados_cobranca_json?.taxa_administracao_percent ??
        0
    );

    const valorBaseContrato = Number(contrato?.valor_acordado || r.valor || 0);

    const valorTaxa = Number(
      ((valorBaseContrato * taxaPercent) / 100).toFixed(2)
    );

    // ✅ repasse = total pago - taxa
    // (se quiser travar pra não ficar negativo, você pode aplicar Math.max)
    const valorRepasse = Number((totalPago - valorTaxa).toFixed(2));

    // ✅ competência é útil pra auditoria
    const competencia = r.dados_cobranca_json?.competencia || null;

    await safeInsert(supabase, {
      tipo: "repasse_proprietario",
      natureza: "saida",
      modulo_financeiro: "ALUGUEL",
      status: "pendente",
      valor: valorRepasse,
      contrato_id: r.contrato_id,
      imovel_id: r.imovel_id,

      aluguel_base_id: null,

      data_vencimento: r.data_pagamento || new Date().toISOString().split("T")[0],
      descricao: "Repasse ao proprietário",
      dados_cobranca_json: {
        origem: "automatica",
        referencia_id: r.id,

        competencia,

        // auditoria do cálculo
        taxa_administracao_percent: taxaPercent,
        valor_base_contrato: valorBaseContrato,
        valor_taxa: valorTaxa,
        valor_pago_total: totalPago,
      },
    });
  }
}

/* ======================================================
   🔄 GERAÇÃO AUTOMÁTICA — COMISSÕES DE VENDA (COMUM)
====================================================== */

async function gerarComissoesVenda(supabase) {
  const { data: vendas } = await supabase
    .from("transacoes")
    .select(`
      id,
      valor,
      imovel_id,
      contrato_id,
      data_pagamento,
      modulo_financeiro
    `)
    .eq("tipo", "receita_venda_imovel")
    .eq("status", "pago")
    .eq("modulo_financeiro", "COMUM");

  for (const v of vendas || []) {
    if (!v.contrato_id || !v.imovel_id) continue;

    const [{ data: imovel }, { data: contrato }] = await Promise.all([
      supabase
        .from("imoveis")
        .select("corretor_id")
        .eq("id", v.imovel_id)
        .single(),

      supabase
        .from("contratos")
        .select("corretor_venda_id")
        .eq("id", v.contrato_id)
        .single(),
    ]);

    const captador = imovel?.corretor_id;
    const vendedor = contrato?.corretor_venda_id;

    const totalComissao = Number(v.valor);
    if (!totalComissao || totalComissao <= 0) continue;

    const criar = async (profileId, valor, descricao) => {
      if (!profileId || valor <= 0) return;

      const existe = await existeDespesaAutomatica(
        supabase,
        v.id,
        "comissao_corretor",
        profileId,
        "COMUM"
      );
      if (existe) return;

      await safeInsert(supabase, {
        tipo: "comissao_corretor",
        natureza: "saida",
        modulo_financeiro: "COMUM",
        status: "pendente",
        profile_id: profileId,
        contrato_id: v.contrato_id,
        imovel_id: v.imovel_id,
        valor,
        data_vencimento: v.data_pagamento,
        descricao,
        dados_cobranca_json: {
          origem: "automatica",
          referencia_id: v.id,
        },
      });
    };

    if (captador && captador === vendedor) {
      await criar(
        captador,
        totalComissao * 0.5,
        "Comissão venda (100% corretor)"
      );
    } else {
      await criar(captador, totalComissao * 0.1, "Comissão captação (10%)");
      await criar(vendedor, totalComissao * 0.4, "Comissão venda (40%)");
    }
  }
}

/* ======================================================
   GET — LISTAGEM + GERAÇÃO AUTOMÁTICA (POR MÓDULO)
====================================================== */

export async function GET(req) {
  const supabase = createServiceClient();

  try {
    const modulo = resolverModulo(req.url);

    await atualizarAtrasos(supabase);

    // ✅ automações rodam somente no módulo certo
    if (modulo === "ALUGUEL") {
      await gerarRepasseProprietario(supabase);
    }

    if (modulo === "COMUM") {
      await gerarComissoesVenda(supabase);
    }

    const { data, error } = await supabase
      .from("transacoes")
      .select(`
        id,
        aluguel_base_id,
        tipo,
        status,
        valor,
        data_vencimento,
        data_pagamento,
        descricao,
        natureza,
        modulo_financeiro,
        dados_cobranca_json,
        profile:profiles(nome_completo),
        imovel:imoveis(titulo, codigo_ref),
        contrato:contratos(
          id,
          codigo,
          proprietario:proprietario_id(nome),
          inquilino:inquilino_id(nome)
        )
      `)
      .eq("natureza", "saida")
      .eq("modulo_financeiro", modulo)
      .order("data_vencimento", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Despesas GET:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ======================================================
   POST — DESPESA MANUAL
====================================================== */

export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();

    const modulo = (body.modulo_financeiro || "COMUM").toUpperCase();
    if (!MODULOS_PERMITIDOS.includes(modulo)) {
      return NextResponse.json(
        { error: "Módulo financeiro inválido." },
        { status: 400 }
      );
    }

    // comissão é automática SOMENTE no módulo aluguel
    if (body.tipo === "comissao_corretor" && modulo === "ALUGUEL") {
      return NextResponse.json(
        { error: "Comissão do corretor é automática no módulo de aluguel." },
        { status: 403 }
      );
    }

    if (TIPOS_DESPESA_AUTOMATICA.includes(body.tipo)) {
      return NextResponse.json(
        { error: "Despesa automática não pode ser criada manualmente." },
        { status: 403 }
      );
    }

    if (!TIPOS_DESPESA_MANUAL.includes(body.tipo)) {
      return NextResponse.json(
        { error: "Tipo de despesa inválido." },
        { status: 400 }
      );
    }

    const payload = {
      tipo: body.tipo,
      natureza: "saida",
      modulo_financeiro: modulo,
      status: "pendente",
      valor: body.valor,
      data_vencimento: body.data_vencimento,
      data_pagamento: null,
      descricao: body.descricao || "",
      contrato_id: body.contrato_id || null,
      imovel_id: body.imovel_id || null,
      aluguel_base_id: body.aluguel_base_id || null,
      profile_id:
        body.tipo === "comissao_corretor" ? body.profile_id || null : null,
      dados_cobranca_json: {
        ...(body.dados_cobranca_json || {}),
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
    console.error("❌ Despesas POST:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ======================================================
   PUT — ATUALIZAÇÃO GOVERNADA
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
      return NextResponse.json(
        { error: "Despesa não encontrada." },
        { status: 404 }
      );
    }

    if (atual.status === "pago") {
      return NextResponse.json(
        { error: "Despesa paga é imutável." },
        { status: 403 }
      );
    }

    const origem = atual.dados_cobranca_json?.origem;

    if (origem === "automatica" && status === "cancelado") {
      return NextResponse.json(
        { error: "Despesa automática não pode ser cancelada." },
        { status: 409 }
      );
    }

    const updates = {
      status,
      updated_at: new Date().toISOString(),
      data_pagamento:
        status === "pago"
          ? data_pagamento || new Date().toISOString().split("T")[0]
          : null,
    };

    const { data, error } = await supabase
      .from("transacoes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Despesas PUT:", err);
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
