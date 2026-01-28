import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();

    const {
      tipos = [],            // array de enums
      data_inicio = null,    // YYYY-MM-DD
      data_fim = null        // YYYY-MM-DD
    } = body;

    let query = supabase
      .from("transacoes")
      .select(`
        id,
        tipo,
        natureza,
        valor,
        data_vencimento,
        data_pagamento,
        descricao,
        contrato_id,
        aluguel_base_id,
        contratos (
          codigo,
          proprietario:proprietario_id ( nome ),
          inquilino:inquilino_id ( nome ),
          imoveis (
            codigo_ref,
            titulo
          )
        )
      `)
      .eq("modulo_financeiro", "ALUGUEL")
      .not("aluguel_base_id", "is", null)
      .neq("status", "cancelado")
      .order("data_vencimento", { ascending: false });

    if (tipos.length) {
      query = query.in("tipo", tipos);
    }

    if (data_inicio) {
      query = query.gte("data_vencimento", data_inicio);
    }

    if (data_fim) {
      query = query.lte("data_vencimento", data_fim);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Relatório lançamentos:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
