import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚀 Dados recentes para tabela rápida do dashboard
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const [imoveis, leads, transacoes] = await Promise.all([
      supabase
        .from("imoveis")
        .select("codigo_ref, titulo, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("leads")
        .select("nome, telefone, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("transacoes")
        .select("descricao, valor, status, data_pagamento")
        .order("data_pagamento", { ascending: false })
        .limit(5)
    ]);

    return NextResponse.json({
      imoveis: imoveis.data || [],
      leads: leads.data || [],
      transacoes: transacoes.data || []
    });
  } catch (error) {
    console.error("Erro ao buscar dados recentes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
