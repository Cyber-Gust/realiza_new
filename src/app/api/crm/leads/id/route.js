import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 🔹 GET → Detalhe do lead
 * 🔹 PUT → Atualiza lead
 * 🔹 DELETE → Remove lead
 */
export async function GET(_, { params }) {
  const supabase = createServiceClient();
  try {
    const { data, error } = await supabase
      .from("leads")
      .select(
        `*, profiles:corretor_id (id, nome_completo), propostas(id, valor_proposta, status, created_at)`
      )
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ GET /crm/leads/[id]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const supabase = createServiceClient();
  try {
    const body = await req.json();
    const updatePayload = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    if (typeof body.perfil_busca_json === "string")
      updatePayload.perfil_busca_json = JSON.parse(body.perfil_busca_json);

    const { data, error } = await supabase
      .from("leads")
      .update(updatePayload)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ message: "Lead atualizado com sucesso!", data });
  } catch (err) {
    console.error("❌ PUT /crm/leads/[id]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  const supabase = createServiceClient();
  try {
    const { error } = await supabase.from("leads").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ message: "Lead removido com sucesso!" });
  } catch (err) {
    console.error("❌ DELETE /crm/leads/[id]:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
