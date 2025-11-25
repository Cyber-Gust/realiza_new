import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ============================================================
   📌 GET /api/crm/leads
============================================================ */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");
  const status = searchParams.get("status");
  const corretor_id = searchParams.get("corretor_id");
  const search = searchParams.get("search");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const onlyOrigens = searchParams.get("origens") === "1";

  try {
    /* 🔹 Retornar apenas origens distintas */
    if (onlyOrigens) {
      const { data, error } = await supabase
        .from("leads")
        .select("origem")
        .not("origem", "is", null);

      if (error) throw error;

      const origens = [
        ...new Set(
          data
            .map((l) => l.origem?.trim())
            .filter(Boolean)
            .map((o) => o.charAt(0).toUpperCase() + o.slice(1).toLowerCase())
        ),
      ];

      return NextResponse.json({ data: origens });
    }

    /* 🔹 Query base */
    let query = supabase
      .from("leads")
      .select(
        `
          id,
          nome,
          email,
          telefone,
          status,
          origem,
          corretor_id,

          interesse_tipo,
          interesse_disponibilidade,
          faixa_preco_min,
          faixa_preco_max,
          quartos,
          banheiros,
          suites,
          vagas,
          cidade_preferida,
          bairro_preferido,
          pet_friendly,
          mobiliado,
          condominio_max,
          urgencia,
          motivo_busca,
          observacoes,
          perfil_busca_json,

          created_at,
          updated_at,
          profiles:corretor_id (
            id,
            nome_completo,
            role
          )
        `
      )
      .order("created_at", { ascending: false });

    if (id) query = query.eq("id", id);
    if (status) query = query.eq("status", status);
    if (corretor_id) query = query.eq("corretor_id", corretor_id);

    if (search) {
      query = query.or(
        `nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`
      );
    }

    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data, error } = await query;
    if (error) throw error;

    if (id) return NextResponse.json({ data: data?.[0] || null });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ GET /crm/leads:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   📌 POST /api/crm/leads
============================================================ */
export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();

    if (!body.nome || !body.telefone) {
      return NextResponse.json(
        { error: "Nome e telefone são obrigatórios." },
        { status: 400 }
      );
    }

    const payload = {
      nome: body.nome,
      email: body.email || null,
      telefone: body.telefone,
      origem: body.origem || "manual",
      corretor_id: body.corretor_id || null,
      status: body.status || "novo",

      /** ENUMS CORRETOS */
      interesse_tipo: body.interesse_tipo || null,
      interesse_disponibilidade: body.interesse_disponibilidade || null,

      faixa_preco_min: body.faixa_preco_min || null,
      faixa_preco_max: body.faixa_preco_max || null,
      quartos: body.quartos || null,
      banheiros: body.banheiros || null,
      suites: body.suites || null,
      vagas: body.vagas || null,
      cidade_preferida: body.cidade_preferida || null,
      bairro_preferido: body.bairro_preferido || null,
      pet_friendly: body.pet_friendly ?? null,
      mobiliado: body.mobiliado ?? null,
      condominio_max: body.condominio_max || null,
      urgencia: body.urgencia || null,
      motivo_busca: body.motivo_busca || null,
      observacoes: body.observacoes || null,

      perfil_busca_json:
        typeof body.perfil_busca_json === "string"
          ? JSON.parse(body.perfil_busca_json)
          : body.perfil_busca_json || {},

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "Lead criado com sucesso!",
      data,
    });
  } catch (err) {
    console.error("❌ POST /crm/leads:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   📌 PUT /api/crm/leads
============================================================ */
export async function PUT(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório." },
        { status: 400 }
      );
    }

    const updatePayload = {
      ...updates,
      interesse_tipo: updates.interesse_tipo || null,
      interesse_disponibilidade: updates.interesse_disponibilidade || null,
      updated_at: new Date().toISOString(),
    };

    if (typeof updatePayload.perfil_busca_json === "string") {
      updatePayload.perfil_busca_json = JSON.parse(
        updatePayload.perfil_busca_json
      );
    }

    const { data, error } = await supabase
      .from("leads")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "Lead atualizado com sucesso!",
      data,
    });
  } catch (err) {
    console.error("❌ PUT /crm/leads:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   📌 DELETE /api/crm/leads
============================================================ */
export async function DELETE(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("leads").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      message: "Lead removido com sucesso!",
    });
  } catch (err) {
    console.error("❌ DELETE /crm/leads:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
