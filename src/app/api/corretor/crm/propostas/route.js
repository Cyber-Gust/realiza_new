import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/* ============================================================
   🧽 Normalizador universal de UUID
============================================================ */
function cleanUUID(v, fallback) {
  if (v === undefined) return fallback;        // campo não enviado → mantém antigo
  if (v === null) return null;                 // explicitamente null → seta null
  if (typeof v === "string" && v.trim() === "") return null; // "" → null
  return v;                                     // caso contrário → valor válido
}

/* ============================================================
   🧩 Cria persona automaticamente para lead
============================================================ */
async function ensurePersonaForLead(service, lead_id) {
  const { data: lead } = await service
    .from("leads")
    .select("*")
    .eq("id", lead_id)
    .single();

  if (!lead) throw new Error("Lead não encontrado.");

  // 1) persona já existe? usa ela
  const { data: existing } = await service
    .from("personas")
    .select("id")
    .or(`telefone.eq.${lead.telefone},email.eq.${lead.email}`);

  if (existing?.length > 0) {
    // ✔ apaga lead imediatamente
    await service.from("leads").delete().eq("id", lead_id);
    return existing[0].id;
  }

  // 2) cria nova persona
  const { data: persona, error } = await service
    .from("personas")
    .insert({
      nome: lead.nome,
      email: lead.email,
      telefone: lead.telefone,
      tipo: "cliente",
    })
    .select()
    .single();

  if (error) throw error;

  // ✔ apaga lead após criar persona
  await service.from("leads").delete().eq("id", lead_id);

  return persona.id;
}

/* ============================================================
   📌 GET /api/crm/propostas
============================================================ */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const bootstrap = searchParams.get("bootstrap");
  const id = searchParams.get("id");

  /* ----------------------------------------------
     🚀 BOOTSTRAP (listas do form)
  ---------------------------------------------- */
  if (bootstrap === "1") {
    try {
      const [imoveis, leads, personas, corretores] = await Promise.all([
        supabase
          .from("imoveis")
          .select("id, titulo, endereco_bairro")
          .order("titulo"),

        supabase
          .from("leads")
          .select("id, nome, email, telefone")
          .order("nome"),

        supabase
          .from("personas")
          .select("id, nome, email, telefone, tipo")
          .order("nome"),

        supabase
          .from("profiles")
          .select("id, nome_completo, role")
          .in("role", ["corretor", "admin"]),
      ]);

      return NextResponse.json({
        boot: {
          imoveis: imoveis.data || [],
          leads: leads.data || [],
          personas: personas.data || [],
          corretores: corretores.data || [],
        },
      });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  /* ----------------------------------------------
     🔍 LISTAGEM NORMAL
  ---------------------------------------------- */
  const filters = {
    lead_id: searchParams.get("lead_id"),
    persona_id: searchParams.get("persona_id"),
    corretor_id: searchParams.get("corretor_id"),
    imovel_id: searchParams.get("imovel_id"),
    status: searchParams.get("status"),
    q: searchParams.get("q"),
  };

  const orderBy = searchParams.get("orderBy") || "created_at";
  const orderDir = searchParams.get("orderDir") === "asc" ? "asc" : "desc";

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from("propostas")
      .select(
        `
        *,
        lead:lead_id ( id, nome, telefone, email ),
        persona:persona_id ( id, nome, telefone, email, tipo ),
        imovel:imovel_id ( id, titulo, endereco_bairro ),
        corretor:corretor_id ( id, nome_completo, role )
      `,
        { count: "exact" }
      )
      .order(orderBy, { ascending: orderDir === "asc" })
      .range(from, to);

    if (id) query.eq("id", id);
    if (filters.lead_id) query.eq("lead_id", filters.lead_id);
    if (filters.persona_id) query.eq("persona_id", filters.persona_id);
    if (filters.corretor_id) query.eq("corretor_id", filters.corretor_id);
    if (filters.imovel_id) query.eq("imovel_id", filters.imovel_id);
    if (filters.status) query.eq("status", filters.status);

    if (filters.q) query.ilike("observacoes", `%${filters.q}%`);

    const { data, count, error } = await query;

    if (error) throw error;

    if (id) return NextResponse.json({ data: data?.[0] || null });

    return NextResponse.json({ data, count });
  } catch (err) {
    console.error("❌ GET /crm/propostas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   📌 POST — CRIAR PROPOSTA
============================================================ */
export async function POST(req) {
  const supabase = await createClient();
  const service = createServiceClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });

    const body = await req.json();

    if (!body.imovel_id) return NextResponse.json({ error: "Escolha o imóvel." }, { status: 400 });
    if (!body.corretor_id) return NextResponse.json({ error: "Escolha o corretor." }, { status: 400 });

    if (!body.lead_id && !body.persona_id)
      return NextResponse.json({ error: "Escolha lead OU pessoa." }, { status: 400 });

    if (body.lead_id && body.persona_id)
      return NextResponse.json({ error: "Não selecione ambos." }, { status: 400 });

    const now = new Date().toISOString();

    let persona_id = body.persona_id || null;

    if (!persona_id && body.lead_id) {
      persona_id = await ensurePersonaForLead(service, body.lead_id);

      // Quando o lead vira persona, o FK de lead tem que sumir
      body.lead_id = null;
    }

    const payload = {
      imovel_id: body.imovel_id,
      corretor_id: body.corretor_id,
      lead_id: body.lead_id,  // agora OK
      persona_id,
      valor_proposta: Number(body.valor_proposta),
      entrada: body.entrada != null ? Number(body.entrada) : null,
      parcelas: body.parcelas != null ? Number(body.parcelas) : null,
      condicao_garantia: body.condicao_garantia || null,
      observacoes: body.observacoes || null,
      origem_proposta: body.origem_proposta || null,
      tipo_pagamento: body.tipo_pagamento || null,
      data_validade: body.data_validade || null,
      status: "pendente",
      historico_status: [{ from: null, to: "pendente", date: now }],
      created_at: now,
    };

    const { data, error } = await service
      .from("propostas")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Proposta criada!", data });
  } catch (err) {
    console.error("❌ POST /propostas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   📌 PATCH — EDITAR PROPOSTA (VERSÃO BLINDADA)
============================================================ */
export async function PATCH(req) {
  const supabase = await createClient();
  const service = createServiceClient();

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id)
      return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });

    const { data: me } = await service
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    const { data: old } = await service
      .from("propostas")
      .select("*")
      .eq("id", id)
      .single();

    if (!old)
      return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });

    const isOwner = old.corretor_id === me.id;
    const isAdmin = me.role === "admin";

    if (!isOwner && !isAdmin)
      return NextResponse.json({ error: "Sem permissão para editar." }, { status: 403 });

    const normalized = {
      imovel_id: cleanUUID(updates.imovel_id, old.imovel_id),
      lead_id: cleanUUID(updates.lead_id, old.lead_id),
      persona_id: cleanUUID(updates.persona_id, old.persona_id),
      corretor_id: cleanUUID(updates.corretor_id, old.corretor_id),

      valor_proposta:
        updates.valor_proposta != null ? Number(updates.valor_proposta) : old.valor_proposta,

      entrada:
        updates.entrada != null ? Number(updates.entrada) : old.entrada,

      parcelas:
        updates.parcelas != null ? Number(updates.parcelas) : old.parcelas,

      condicao_garantia: updates.condicao_garantia ?? old.condicao_garantia,
      observacoes: updates.observacoes ?? old.observacoes,
      origem_proposta: updates.origem_proposta ?? old.origem_proposta,
      tipo_pagamento: updates.tipo_pagamento ?? old.tipo_pagamento,
      data_validade: updates.data_validade ?? old.data_validade,

      status: updates.status ?? old.status,
    };

    if (normalized.lead_id && normalized.persona_id)
      return NextResponse.json({ error: "Escolha apenas lead OU persona." }, { status: 400 });

    if (!normalized.lead_id && !normalized.persona_id)
      return NextResponse.json({ error: "Selecione lead OU persona." }, { status: 400 });

    const now = new Date().toISOString();
    const historico = old.historico_status || [];

    if (normalized.status !== old.status) {
      historico.push({
        from: old.status,
        to: normalized.status,
        date: now,
      });
    }

    const payload = {
      ...normalized,
      historico_status: historico,
      updated_at: now,
    };

    const { data, error } = await service
      .from("propostas")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Proposta atualizada!", data });
  } catch (err) {
    console.error("❌ PATCH /propostas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   📌 DELETE — REMOVER PROPOSTA
============================================================ */
export async function DELETE(req) {
  const supabase = createServiceClient();
  const id = new URL(req.url).searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  try {
    const { error } = await supabase.from("propostas").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Proposta removida!" });
  } catch (err) {
    console.error("❌ DELETE /propostas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
