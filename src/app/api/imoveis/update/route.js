//src/app/api/imoveis/update/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 🔥 Atualiza imóvel (painel admin)
 * - Usa Service Role → ignora RLS
 * - Garante timestamp e tratamento dos novos campos
 */
export async function PUT(req) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "ID do imóvel é obrigatório." },
        { status: 400 }
      );
    }

    // 🧹 Sanitiza o payload: remove campos undefined
    const updateData = Object.fromEntries(
      Object.entries(body).filter(([_, v]) => v !== undefined)
    );

    // 🧱 Validação básica de tipos
    if (updateData.corretor_id && typeof updateData.corretor_id !== "string") {
      return NextResponse.json(
        { error: "corretor_id deve ser uma string UUID válida." },
        { status: 400 }
      );
    }

    if (
      updateData.disponibilidade &&
      !["venda", "locacao", "ambos"].includes(updateData.disponibilidade)
    ) {
      return NextResponse.json(
        { error: "Valor inválido para disponibilidade." },
        { status: 400 }
      );
    }

    // 🔹 Atualiza o registro no Supabase
    const { data, error } = await supabase
      .from("imoveis")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Erro ao atualizar imóvel:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
