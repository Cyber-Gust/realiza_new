import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();

    // 🔹 Executa consultas principais em paralelo
    const [
      imoveisDisponiveis,
      contratosAtivos,
      leadsTotal,
      transacoesRes
    ] = await Promise.all([
      supabase.from("imoveis").select("*", { count: "exact", head: true }).eq("status", "disponivel"),
      supabase.from("contratos").select("*", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("transacoes").select("valor, tipo, status, data_pagamento")
    ]);

    // 🔸 Contadores principais
    const imoveis = imoveisDisponiveis.count || 0;
    const contratos = contratosAtivos.count || 0;
    const leads = leadsTotal.count || 0;
    const transacoes = transacoesRes.data || [];

    // 🔸 Receita do mês atual
    const now = new Date();
    const mes = now.getMonth() + 1;
    const ano = now.getFullYear();

    const receitaMes = transacoes
      .filter((t) => {
        if (!t.data_pagamento) return false;
        const d = new Date(t.data_pagamento);
        return (
          t.status === "pago" &&
          t.tipo === "receita_aluguel" &&
          d.getMonth() + 1 === mes &&
          d.getFullYear() === ano
        );
      })
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);

    // ✅ Retorna as métricas principais
    return NextResponse.json({
      imoveis,
      contratos,
      leads,
      receitaMes,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar KPIs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
