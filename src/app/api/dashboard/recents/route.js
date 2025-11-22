// src/app/api/dashboard/recents/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Cria instância do Supabase com Service Role (somente server-side).
 */
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
    }
  );
}

/**
 * Função utilitária para validar erros do Supabase.
 */
function validate(res, label) {
  if (res.error) {
    throw new Error(
      `Erro ao buscar ${label}: ${res.error.message || "erro desconhecido"}`
    );
  }
  return res.data ?? [];
}

/**
 * Handler principal
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    // =============================================
    // PARALLEL FETCH REAL — sem gargalos
    // =============================================
    const [imoveisRes, leadsRes, transacoesRes] = await Promise.all([
      supabase
        .from("imoveis")
        .select("id, codigo_ref, titulo, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("leads")
        .select("id, nome, telefone, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("transacoes")
        .select("id, descricao, valor, status, data_pagamento, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // =============================================
    // VALIDATION
    // =============================================
    const imoveis = validate(imoveisRes, "imóveis recentes");
    const leads = validate(leadsRes, "leads recentes");
    const transacoes = validate(transacoesRes, "transações recentes");

    // =============================================
    // RESPONSE
    // =============================================
    return NextResponse.json({
      imoveis,
      leads,
      transacoes,
    });
  } catch (error) {
    console.error("🔥 Erro na rota /recents:", error);

    return NextResponse.json(
      {
        error: "Erro ao buscar dados recentes",
        detail: error?.message || "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
