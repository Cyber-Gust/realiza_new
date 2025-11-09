import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 🔹 GET → Lista eventos do corretor autenticado
 * 🔹 POST → Cria novo evento do corretor autenticado
 */
export async function GET() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("agenda_eventos")
      .select(`
        id,
        titulo,
        tipo,
        tipo_participante,
        participante_id,
        local,
        observacoes,
        data_inicio,
        data_fim,
        imovel_id,
        created_at,
        imoveis (titulo, endereco_bairro)
      `)
      .eq("profile_id", user.id)
      .order("data_inicio", { ascending: true });

    if (error) throw error;

    // 🔹 Enriquecimento opcional: resolve nome do participante (lead, persona, equipe)
    const eventosEnriquecidos = [];
    for (const ev of data) {
      let participante = null;

      if (ev.tipo_participante === "lead" && ev.participante_id) {
        const { data: lead } = await supabase
          .from("leads")
          .select("nome, telefone")
          .eq("id", ev.participante_id)
          .maybeSingle();
        participante = lead ? `${lead.nome} (${lead.telefone})` : null;
      } else if (
        ["proprietario", "inquilino", "cliente"].includes(ev.tipo_participante)
      ) {
        const { data: persona } = await supabase
          .from("personas")
          .select("nome, telefone")
          .eq("id", ev.participante_id)
          .maybeSingle();
        participante = persona ? `${persona.nome} (${persona.telefone})` : null;
      } else if (ev.tipo_participante === "interno") {
        const { data: userData } = await supabase
          .from("profiles")
          .select("nome_completo, telefone")
          .eq("id", ev.participante_id)
          .maybeSingle();
        participante = userData
          ? `${userData.nome_completo} (${userData.telefone})`
          : null;
      } else {
        participante = ev.participante_id || null;
      }

      eventosEnriquecidos.push({ ...ev, participante });
    }

    return NextResponse.json({ data: eventosEnriquecidos });
  } catch (err) {
    console.error("❌ GET /crm/agenda:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const supabase = await createClient();

  try {
    const body = await req.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    // 🔹 Verifica conflito de horário
    const { data: conflito } = await supabase
      .from("agenda_eventos")
      .select("id")
      .eq("profile_id", user.id)
      .lte("data_inicio", body.data_fim)
      .gte("data_fim", body.data_inicio)
      .maybeSingle();

    if (conflito)
      return NextResponse.json(
        { error: "Você já possui um evento neste horário." },
        { status: 409 }
      );

    const payload = {
      profile_id: user.id,
      titulo: body.titulo?.trim() || "Evento sem título",
      tipo: body.tipo || "visita_presencial",
      tipo_participante: body.tipo_participante || "lead",
      participante_id: body.participante_id || null,
      imovel_id: body.imovel_id || null,
      local: body.local || null,
      observacoes: body.observacoes || null,
      data_inicio: body.data_inicio,
      data_fim: body.data_fim,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("agenda_eventos")
      .insert(payload)
      .select("id, tipo, participante_id, tipo_participante")
      .single();

    if (error) throw error;

    // 🔹 Atualiza lead se for visita
    if (data.tipo.includes("visita") && data.tipo_participante === "lead" && data.participante_id) {
      await supabase
        .from("leads")
        .update({ status: "visita_agendada" })
        .eq("id", data.participante_id);
    }

    return NextResponse.json({ message: "Evento criado com sucesso!", data });
  } catch (err) {
    console.error("❌ POST /crm/agenda:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
