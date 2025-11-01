import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 🔥 Atualiza imóvel (painel admin)
 * - Usa Service Role → ignora RLS
 * - Garante timestamp e retorno completo
 */
export async function PUT(req) {
  try {
    const supabase = createServiceClient(); // 👈 usa o client com permissão total
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "ID do imóvel obrigatório." },
        { status: 400 }
      );
    }

    // 🔹 Atualiza imóvel
    const { data, error } = await supabase
      .from("imoveis")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw error;

    // 🔹 Retorno padronizado
    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Erro ao atualizar imóvel:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
