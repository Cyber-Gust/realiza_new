import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ======================================================
   HELPERS
====================================================== */

async function atualizarAtrasos(supabase) {
  const hoje = new Date().toISOString().split("T")[0];

  await supabase
    .from("transacoes")
    .update({ status: "atrasado" })
    .eq("status", "pendente")
    .lt("data_vencimento", hoje);
}

function classificarFluxo(transacoes) {
  const tiposReceita = [
    "receita_aluguel",
    "taxa_adm_imobiliaria",
    "receita_venda_imovel",
  ];

  const receitas = [];
  const despesas = [];

  for (const t of transacoes) {
    if (tiposReceita.includes(t.tipo)) receitas.push(t);
    else despesas.push(t);
  }

  return { receitas, despesas };
}

function calcularResumo(receitas, despesas) {
  const totalReceitas = receitas.reduce(
    (sum, r) => sum + Number(r.valor || 0),
    0
  );

  const totalDespesas = despesas.reduce(
    (sum, d) => sum + Number(d.valor || 0),
    0
  );

  const saldo = totalReceitas - totalDespesas;

  return {
    total_receitas: totalReceitas,
    total_despesas: totalDespesas,
    saldo,
    status_saldo:
      saldo > 0 ? "positivo" : saldo < 0 ? "negativo" : "neutro",
  };
}

/* ======================================================
   GET — DASHBOARD FINANCEIRO
====================================================== */

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "fluxo";

  try {
    // 🔄 mantém consistência contábil
    await atualizarAtrasos(supabase);

    /* ======================================================
       BASE — TRANSAÇÕES VÁLIDAS
    ====================================================== */
    const { data: transacoes, error } = await supabase
      .from("transacoes")
      .select(`
        id,
        tipo,
        natureza,
        status,
        valor,
        data_vencimento,
        data_pagamento,
        descricao
      `)
      .neq("status", "cancelado");

    if (error) throw error;

    /* ======================================================
       FLUXO DE CAIXA (PAINEL ATUAL)
    ====================================================== */
    if (type === "fluxo") {
      const { receitas, despesas } = classificarFluxo(transacoes);
      const resumo = calcularResumo(receitas, despesas);

      return NextResponse.json({
        data: transacoes,
        meta: {
          ...resumo,
          total_lancamentos: transacoes.length,
        },
      });
    }

    /* ======================================================
       RESUMO EXECUTIVO (KPIs)
    ====================================================== */
    if (type === "resumo") {
      const { receitas, despesas } = classificarFluxo(transacoes);
      const resumo = calcularResumo(receitas, despesas);

      const inadimplentes = transacoes.filter(
        t => t.status === "pendente" || t.status === "atrasado"
      );

      return NextResponse.json({
        data: [],
        meta: {
          ...resumo,
          total_inadimplentes: inadimplentes.length,
          valor_inadimplente: inadimplentes.reduce(
            (sum, t) => sum + Number(t.valor || 0),
            0
          ),
        },
      });
    }

    /* ======================================================
       LANÇAMENTOS GERAIS
    ====================================================== */
    if (type === "lancamentos") {
      return NextResponse.json({
        data: transacoes.sort(
          (a, b) =>
            new Date(b.data_vencimento) - new Date(a.data_vencimento)
        ),
        meta: { total: transacoes.length },
      });
    }

    return NextResponse.json(
      { error: "Tipo de consulta inválido." },
      { status: 400 }
    );
  } catch (err) {
    console.error("❌ Financeiro dashboard:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/* ======================================================
   BLOQUEIOS ABSOLUTOS
====================================================== */

export async function POST() {
  return NextResponse.json(
    { error: "Operação não permitida em financeiro." },
    { status: 403 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Operação não permitida em financeiro." },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Operação não permitida em financeiro." },
    { status: 403 }
  );
}
