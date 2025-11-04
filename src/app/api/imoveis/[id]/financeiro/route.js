import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Retorna métricas financeiras do imóvel:
 * - Vacância (dias sem contrato)
 * - Último contrato
 * - Receita total e despesas totais
 * - Último pagamento recebido
 */
export async function GET(req, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();

  try {
    const { searchParams } = new URL(req.url);
    const onlyVacancia = searchParams.get("vacancia");

    // 🔹 Busca o último contrato do imóvel
    const { data: contratos, error: contratoErr } = await supabase
      .from("contratos")
      .select("id, tipo, data_inicio, data_fim, valor_acordado, status")
      .eq("imovel_id", id)
      .order("data_fim", { ascending: false })
      .limit(1);

    if (contratoErr) throw contratoErr;

    const ultimoContrato = contratos?.[0] || null;
    let diasVacancia = null;

    // 🔹 Calcula vacância se houver contrato
    if (ultimoContrato?.data_fim) {
      const hoje = new Date();
      const dataFim = new Date(ultimoContrato.data_fim);
      const diffMs = hoje - dataFim;
      diasVacancia = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
    }

    // 🔹 Se foi chamada apenas para vacância (widget)
    if (onlyVacancia) {
      return NextResponse.json({
        dias: diasVacancia,
        ultimo_contrato: ultimoContrato
          ? { id: ultimoContrato.id, data_fim: ultimoContrato.data_fim }
          : null,
      });
    }

    // 🔹 Receita e despesa total do imóvel
    const { data: transacoes, error: txErr } = await supabase
      .from("transacoes")
      .select("tipo, valor, status, data_pagamento")
      .eq("imovel_id", id)
      .in("status", ["pago", "pendente"]);

    if (txErr) throw txErr;

    let receitaTotal = 0;
    let despesaTotal = 0;
    let ultimoPagamento = null;

    transacoes?.forEach((t) => {
      if (t.status === "pago") {
        if (t.tipo.startsWith("receita_")) receitaTotal += Number(t.valor);
        if (t.tipo.startsWith("despesa_") || t.tipo.startsWith("pagamento_"))
          despesaTotal += Number(t.valor);

        if (!ultimoPagamento || new Date(t.data_pagamento) > new Date(ultimoPagamento))
          ultimoPagamento = t.data_pagamento;
      }
    });

    // 🔹 Retorno geral do módulo financeiro
    return NextResponse.json({
      imovel_id: id,
      vacancia: {
        dias: diasVacancia,
        ultimo_contrato: ultimoContrato,
      },
      financeiro: {
        receita_total: receitaTotal,
        despesa_total: despesaTotal,
        saldo: receitaTotal - despesaTotal,
        ultimo_pagamento: ultimoPagamento,
      },
      ultimo_contrato: ultimoContrato,
    });
  } catch (err) {
    console.error("Erro no financeiro:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
