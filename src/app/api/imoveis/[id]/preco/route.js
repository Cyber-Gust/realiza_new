import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();


  try {
    const { data, error } = await supabase
      .from("agenda_eventos")
      .select("id, created_at, tipo, titulo")
      .eq("imovel_id", id)
      .eq("tipo", "ajuste_preco")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();


  try {
    const { tipo, valor } = await req.json();
    const field = tipo === "locacao" ? "preco_locacao" : "preco_venda";

    // Atualiza valor do imóvel
    const { error: updateError } = await supabase
      .from("imoveis")
      .update({ [field]: valor })
      .eq("id", id);
    if (updateError) throw updateError;

    // Registra evento de ajuste
    await supabase.from("agenda_eventos").insert({
      imovel_id: id,
      tipo: "ajuste_preco",
      titulo: `Ajuste ${tipo} → ${valor}`,
      created_at: new Date().toISOString(),
    });

    // Retorna histórico atualizado
    const { data } = await supabase
      .from("agenda_eventos")
      .select("id, created_at, tipo, titulo")
      .eq("imovel_id", id)
      .eq("tipo", "ajuste_preco")
      .order("created_at", { ascending: false });

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
