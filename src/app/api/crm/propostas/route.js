import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/* ============================================================
   📌 GET /api/crm/propostas
   Listagem completa + filtros + joins + paginação
   ============================================================ */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");
  const lead_id = searchParams.get("lead_id");
  const corretor_id = searchParams.get("corretor_id");
  const imovel_id = searchParams.get("imovel_id");
  const status = searchParams.get("status");
  const q = searchParams.get("q");
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
        id,
        imovel_id,
        lead_id,
        corretor_id,
        valor_proposta,
        condicao_garantia,
        observacoes,
        status,
        created_at,
        updated_at,
        leads:lead_id ( id, nome, telefone, email ),
        imoveis:imovel_id ( id, titulo, endereco_bairro ),
        profiles:corretor_id ( id, nome_completo, role )
      `,
        { count: "exact" }
      )
      .order(orderBy, { ascending: orderDir === "asc" })
      .range(from, to);

    if (id) query = query.eq("id", id);
    if (lead_id) query = query.eq("lead_id", lead_id);
    if (corretor_id) query = query.eq("corretor_id", corretor_id);
    if (imovel_id) query = query.eq("imovel_id", imovel_id);
    if (status) query = query.eq("status", status);

    // 🔎 Busca textual
    if (q) {
      query = query.or(
        `
        leads.nome.ilike.%${q}%,
        imoveis.titulo.ilike.%${q}%,
        observacoes.ilike.%${q}%,
        condicao_garantia.ilike.%${q}%
      `
      );
    }

    const { data, count, error } = await query;
    if (error) throw error;

    // modo detalhe
    if (id) return NextResponse.json({ data: data?.[0] || null });

    return NextResponse.json({ data, count });
  } catch (err) {
    console.error("❌ GET /crm/propostas:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   📌 POST /api/crm/propostas
   Cria nova proposta
   ============================================================ */
export async function POST(req) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });

    const body = await req.json();

    if (!body.imovel_id || !body.lead_id || !body.valor_proposta) {
      return NextResponse.json(
        { error: "Campos obrigatórios: imovel_id, lead_id e valor_proposta." },
        { status: 400 }
      );
    }

    const payload = {
      imovel_id: body.imovel_id,
      lead_id: body.lead_id,
      corretor_id: body.corretor_id || user.id,
      valor_proposta: Number(body.valor_proposta),
      condicao_garantia: body.condicao_garantia || "",
      observacoes: body.observacoes || "",
      status: body.status || "pendente",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("propostas")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "Proposta criada com sucesso!",
      data,
    });
  } catch (err) {
    console.error("❌ POST /crm/propostas:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   📌 PATCH /api/crm/propostas
   Atualiza proposta (somente dono ou admin)
   ============================================================ */
export async function PATCH(req) {
  const supabase = await createClient();
  const service = createServiceClient();

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id)
      return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });

    // autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });

    // dados do usuário
    const { data: me } = await service
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    // proposta atual
    const { data: proposta } = await service
      .from("propostas")
      .select("corretor_id")
      .eq("id", id)
      .single();

    const isOwner = proposta?.corretor_id === me.id;
    const isAdmin = me?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Sem permissão para editar esta proposta." },
        { status: 403 }
      );
    }

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await service
      .from("propostas")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "Proposta atualizada com sucesso!",
      data,
    });
  } catch (err) {
    console.error("❌ PATCH /crm/propostas:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   📌 DELETE /api/crm/propostas
   Remove proposta (service role)
   ============================================================ */
export async function DELETE(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (!id)
      return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });

    const { error } = await supabase.from("propostas").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ message: "Proposta removida com sucesso!" });
  } catch (err) {
    console.error("❌ DELETE /crm/propostas:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
