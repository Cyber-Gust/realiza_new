import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const corretor_id = searchParams.get("corretor_id");
  const origem = searchParams.get("origem");

  try {
    let query = supabase
    .from("leads")
    .select(
      `
      id, nome, email, telefone, status, origem, 
      corretor:corretor_id ( id, nome_completo ),
      created_at, updated_at
      `,
      { distinct: "id" } // 🔥 evita duplicação
    );

    if (status) query = query.eq("status", status);
    if (corretor_id) query = query.eq("corretor_id", corretor_id);
    if (origem) query = query.ilike("origem", `%${origem}%`);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const supabase = createServiceClient();
  try {
    const body = await req.json();
    const { nome, email, telefone, status, origem, corretor_id, perfil_busca_json } = body;

    if (!nome || !telefone)
      return NextResponse.json({ success: false, error: "Nome e telefone são obrigatórios" }, { status: 400 });

    const { data, error } = await supabase
      .from("leads")
      .insert([{ nome, email, telefone, status: status || "novo", origem, corretor_id, perfil_busca_json }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
