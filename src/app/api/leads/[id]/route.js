//src/app/api/leads/[id]

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req, { params }) {
  const supabase = createServiceClient();
  try {
    const { data, error } = await supabase
      .from("leads")
      .select(`
        *,
        corretor:corretor_id ( id, nome_completo )
      `)
      .eq("id", params.id)
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const supabase = createServiceClient();
  try {
    const body = await req.json();
    const { nome, email, telefone, status, origem, corretor_id, perfil_busca_json } = body;

    const { data, error } = await supabase
      .from("leads")
      .update({ nome, email, telefone, status, origem, corretor_id, perfil_busca_json, updated_at: new Date() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  const supabase = createServiceClient();
  try {
    const { id } = await context.params; // 👈 AQUI ESTÁ A MÁGICA
    const { error } = await supabase.from("leads").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao excluir lead:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
