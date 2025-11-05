import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const lead_id = searchParams.get("lead_id");
  const corretor_id = searchParams.get("corretor_id");

  try {
    let query = supabase.from("agenda_eventos").select(`
      id, titulo, tipo, data_inicio, data_fim, 
      lead:lead_id ( id, nome ),
      imovel:imovel_id ( id, titulo ),
      profile:profile_id ( id, nome_completo )
    `);

    if (lead_id) query = query.eq("lead_id", lead_id);
    if (corretor_id) query = query.eq("profile_id", corretor_id);

    const { data, error } = await query.order("data_inicio", { ascending: true });
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
    const { profile_id, lead_id, imovel_id, titulo, tipo, data_inicio, data_fim } = body;

    const { data, error } = await supabase
      .from("agenda_eventos")
      .insert([{ profile_id, lead_id, imovel_id, titulo, tipo, data_inicio, data_fim }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    const { error } = await supabase.from("agenda_eventos").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
