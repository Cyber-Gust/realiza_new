import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const lead_id = searchParams.get("lead_id");
  const corretor_id = searchParams.get("corretor_id");
  const imovel_id = searchParams.get("imovel_id");
  const status = searchParams.get("status");

  try {
    let query = supabase.from("propostas").select(`
      id, valor_proposta, condicao_garantia, status, created_at,
      lead:lead_id ( id, nome ),
      corretor:corretor_id ( id, nome_completo ),
      cliente:cliente_id ( id, nome_completo ),
      imovel:imovel_id ( id, titulo )
    `);

    if (lead_id) query = query.eq("lead_id", lead_id);
    if (corretor_id) query = query.eq("corretor_id", corretor_id);
    if (imovel_id) query = query.eq("imovel_id", imovel_id);
    if (status) query = query.eq("status", status);

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
    const { imovel_id, lead_id, cliente_id, corretor_id, valor_proposta, condicao_garantia, status } = body;

    if (!imovel_id || !lead_id || !valor_proposta)
      return NextResponse.json({ success: false, error: "Campos obrigatórios ausentes" }, { status: 400 });

    const { data, error } = await supabase
      .from("propostas")
      .insert([{ imovel_id, lead_id, cliente_id, corretor_id, valor_proposta, condicao_garantia, status: status || "pendente" }])
      .select()
      .single();

    if (error) throw error;

    await supabase.from("leads").update({ status: "proposta_feita", updated_at: new Date() }).eq("id", lead_id);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
