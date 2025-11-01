import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    let query = supabase
      .from("profiles")
      .select("id, nome_completo, email, telefone, role")
      .order("nome_completo", { ascending: true });

    // ✅ Corrigido: converter enum em texto para comparar
    if (role) {
      query = query.filter("role", "eq", role);
    }

    const { data, error } = await query;
    if (error) throw error;

    console.log("✅ Perfis retornados:", data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("❌ Erro na API /profiles:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
