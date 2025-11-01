import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 🔥 Rota DELETE para imóveis (painel admin)
 * - Usa Service Role → ignora RLS
 * - Suporta soft delete (marca "inativo")
 * - Suporta hard delete (remove registro real)
 */
export async function DELETE(req) {
  try {
    const supabase = createServiceClient(); // 👈 bypass RLS total
    const { id, soft } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID do imóvel obrigatório." },
        { status: 400 }
      );
    }

    // 🔹 Soft delete → apenas atualiza status
    if (soft) {
      const { data, error } = await supabase
        .from("imoveis")
        .update({
          status: "inativo",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data });
    }

    // 🔹 Hard delete → remove de vez
    const { error } = await supabase.from("imoveis").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao deletar imóvel:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
