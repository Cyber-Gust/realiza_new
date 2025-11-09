import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 🔹 GET → Lista leads com filtros
 * 🔹 POST → Cria lead
 */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const corretor_id = searchParams.get("corretor_id");
  const search = searchParams.get("search");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    let query = supabase
      .from("leads")
      .select(
        `id, nome, email, telefone, status, origem, perfil_busca_json, created_at, updated_at,
         profiles:corretor_id (id, nome_completo)`
      )
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (corretor_id) query = query.eq("corretor_id", corretor_id);
    if (search) {
      query = query.or(
        `nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`
      );
    }
    if (from && to) query = query.gte("created_at", from).lte("created_at", to);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ GET /crm/leads:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();
    const payload = {
      nome: body.nome,
      email: body.email,
      telefone: body.telefone,
      origem: body.origem || "manual",
      corretor_id: body.corretor_id || null,
      status: "novo",
      perfil_busca_json:
        typeof body.perfil_busca_json === "string"
          ? JSON.parse(body.perfil_busca_json)
          : body.perfil_busca_json || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("leads").insert(payload).select().single();
    if (error) throw error;

    return NextResponse.json({ message: "Lead criado com sucesso!", data });
  } catch (err) {
    console.error("❌ POST /crm/leads:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
