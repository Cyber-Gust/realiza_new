import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚀 Consulta resumida de métricas principais
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 🔹 KPIs principais em paralelo
    const [
      { count: imoveis },
      { count: contratos },
      { count: leads },
      { data: transacoes }
    ] = await Promise.all([
      supabase.from("imoveis").select("*", { count: "exact", head: true }).eq("status", "disponivel"),
      supabase.from("contratos").select("*", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("transacoes").select("valor, tipo, status, data_pagamento")
    ]);

    // 🔸 Receita total do mês atual
    const now = new Date();
    const mes = now.getMonth() + 1;
    const ano = now.getFullYear();

    const receitaMes = transacoes
      ?.filter((t) => {
        const d = new Date(t.data_pagamento);
        return (
          t.status === "pago" &&
          t.tipo === "receita_aluguel" &&
          d.getMonth() + 1 === mes &&
          d.getFullYear() === ano
        );
      })
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);

    return NextResponse.json({
      imoveis,
      contratos,
      leads,
      receitaMes
    });
  } catch (error) {
    console.error("Erro ao buscar KPIs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
