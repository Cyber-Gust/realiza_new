import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req, { params }) {
  const supabase = createServiceClient();
  try {
    const { data, error } = await supabase
      .from("propostas")
      .select(`
        *,
        lead:lead_id ( id, nome ),
        corretor:corretor_id ( id, nome_completo ),
        cliente:cliente_id ( id, nome_completo ),
        imovel:imovel_id ( id, titulo )
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
    const { valor_proposta, condicao_garantia, status } = body;

    const { data, error } = await supabase
      .from("propostas")
      .update({ valor_proposta, condicao_garantia, status, updated_at: new Date() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const supabase = createServiceClient();
  try {
    const { error } = await supabase.from("propostas").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
