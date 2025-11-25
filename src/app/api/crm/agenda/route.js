import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/* ============================================================
   📌 GET /api/crm/agenda
   Lista eventos do corretor autenticado (com enriquecimento)
   ============================================================ */
export async function GET() {
  const supabase = await createClient();

  try {
    // 🔐 Autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    // 🔎 Busca eventos do corretor
    const { data: eventos, error } = await supabase
      .from("agenda_eventos")
      .select(`
        id,
        titulo,
        tipo,
        tipo_participante,
        participante_id,
        profile_id,
        local,
        observacoes,
        data_inicio,
        data_fim,
        imovel_id,
        created_at,
        imoveis ( id, titulo, endereco_bairro )
      `)
      .eq("profile_id", user.id)
      .order("data_inicio", { ascending: true });

    if (error) throw error;

    // ============================================================
    // 🔹 Enriquecimento do participante
    // ============================================================
    const service = createServiceClient();

    const enriched = [];
    for (const ev of eventos) {
      let participante = null;

      if (ev.tipo_participante === "lead") {
        const { data: lead } = await service
          .from("leads")
          .select("nome, telefone")
          .eq("id", ev.participante_id)
          .maybeSingle();

        participante = lead
          ? `${lead.nome} (${lead.telefone})`
          : "Lead não encontrado";

      } else if (
        ["proprietario", "inquilino", "cliente"].includes(ev.tipo_participante)
      ) {
        const { data: persona } = await service
          .from("personas")
          .select("nome, telefone")
          .eq("id", ev.participante_id)
          .maybeSingle();

        participante = persona
          ? `${persona.nome} (${persona.telefone})`
          : "Pessoa não encontrada";

      } else if (ev.tipo_participante === "interno") {
        const { data: perfil } = await service
          .from("profiles")
          .select("nome_completo, telefone")
          .eq("id", ev.participante_id)
          .maybeSingle();

        participante = perfil
          ? `${perfil.nome_completo} (${perfil.telefone || "-"})`
          : "Usuário não encontrado";
      }

      enriched.push({
        ...ev,
        participante,
      });
    }

    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error("❌ GET /crm/agenda:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   📌 POST /api/crm/agenda
   Cria novo evento + validação de conflito + atualização do lead
   ============================================================ */
export async function POST(req) {
  const supabase = await createClient();
  const service = createServiceClient();

  try {
    const body = await req.json();

    // 🔐 Autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    // ============================================================
    // 🔥 Validação mínima
    // ============================================================
    if (!body.data_inicio || !body.data_fim)
      return NextResponse.json(
        { error: "data_inicio e data_fim são obrigatórios." },
        { status: 400 }
      );

    // ============================================================
    // 🔎 Verificar conflito de horário
    // ============================================================
    const { data: conflito } = await service
      .from("agenda_eventos")
      .select("id")
      .eq("profile_id", user.id)
      .lte("data_inicio", body.data_fim)
      .gte("data_fim", body.data_inicio)
      .maybeSingle();

    if (conflito)
      return NextResponse.json(
        { error: "Você já possui um evento nesse horário." },
        { status: 409 }
      );

    // ============================================================
    // 🧱 Criar evento
    // ============================================================
    const payload = {
      profile_id: user.id,
      titulo: body.titulo?.trim() || "Evento",
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

    const { data, error } = await service
      .from("agenda_eventos")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // ============================================================
    // 🔁 Atualizar lead automaticamente se for visita
    // ============================================================
    if (
      payload.tipo.includes("visita") &&
      payload.tipo_participante === "lead" &&
      payload.participante_id
    ) {
      await service
        .from("leads")
        .update({ status: "visita_agendada" })
        .eq("id", payload.participante_id);
    }

    return NextResponse.json({
      message: "Evento criado com sucesso!",
      data,
    });
  } catch (err) {
    console.error("❌ POST /crm/agenda:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  const supabase = await createClient();
  const service = createServiceClient();

  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "ID do evento é obrigatório." },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { data, error } = await service
      .from("agenda_eventos")
      .update(body)
      .eq("id", body.id)
      .eq("profile_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "Evento atualizado com sucesso!",
      data,
    });
  } catch (err) {
    console.error("❌ PATCH /crm/agenda:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}