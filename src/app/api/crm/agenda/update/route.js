import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 🔹 PATCH → Atualiza evento existente (somente do corretor autenticado)
 */
export async function PATCH(req) {
  const supabase = await createClient();
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });

    if (!id)
      return NextResponse.json({ error: "ID do evento é obrigatório." }, { status: 400 });

    // 🔹 Valida posse
    const { data: existing, error: fetchError } = await supabase
      .from("agenda_eventos")
      .select("id, profile_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing)
      return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    if (existing.profile_id !== user.id)
      return NextResponse.json(
        { error: "Você não tem permissão para editar este evento." },
        { status: 403 }
      );

    const { data, error } = await supabase
      .from("agenda_eventos")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Evento atualizado com sucesso!", data });
  } catch (err) {
    console.error("❌ PATCH /crm/agenda/update:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
