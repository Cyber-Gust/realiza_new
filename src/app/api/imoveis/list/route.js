import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server"; // 👈 novo client admin

/**
 * 🔥 Rota GET segura (painel admin/corretor)
 * - Usa Service Role → ignora RLS
 * - Mantém filtros dinâmicos e count
 */
export async function GET(req) {
  try {
    // 👇 Usa o client com chave SERVICE_ROLE (bypass RLS)
    const supabase = createServiceClient();

    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    const tipo = searchParams.get("tipo");
    const status = searchParams.get("status");
    const cidade = searchParams.get("cidade");
    const preco_min = searchParams.get("preco_min");
    const preco_max = searchParams.get("preco_max");

    let query = supabase.from("imoveis").select("*", { count: "exact" });

    // 🔹 ID direto
    if (id) query = query.eq("id", id);

    // 🔹 Filtros dinâmicos
    if (tipo && tipo !== "all") query = query.eq("tipo", tipo);

    // 🔹 Corrigido: só aplica se status for realmente específico
    const normalizedStatus = !status || status === "" ? "all" : status;
    if (normalizedStatus !== "all") query = query.eq("status", normalizedStatus);

    if (cidade) query = query.ilike("endereco_cidade", `%${cidade}%`);
    if (preco_min) query = query.gte("preco_venda", Number(preco_min));
    if (preco_max) query = query.lte("preco_venda", Number(preco_max));

    // 🔹 Ordenação
    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (err) {
    console.error("❌ Erro ao listar imóveis:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
