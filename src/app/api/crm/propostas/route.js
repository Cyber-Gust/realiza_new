import { NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";

/**
 * 🔹 GET → Lista propostas (admin / corretor autenticado)
 * 🔹 POST → Cria nova proposta
 * 🔹 PATCH → Atualiza proposta existente (valida dono)
 * 🔹 DELETE → Exclui proposta (service role)
 */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");
  const lead_id = searchParams.get("lead_id");
  const corretor_id = searchParams.get("corretor_id");
  const status = searchParams.get("status");

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
        status,
        created_at,
        observacoes,
        leads ( id, nome, telefone ),
        imoveis ( id, titulo, endereco_bairro ),
        profiles:corretor_id ( id, nome_completo, role )
      `
      )
      .order("created_at", { ascending: false });

    if (id) query = query.eq("id", id);
    if (lead_id) query = query.eq("lead_id", lead_id);
    if (corretor_id) query = query.eq("corretor_id", corretor_id);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    if (id) return NextResponse.json({ data: data?.[0] || null });
    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ GET /crm/propostas:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
    if (!body.imovel_id || !body.lead_id || !body.valor_proposta)
      return NextResponse.json(
        { error: "Campos obrigatórios: imóvel, lead e valor." },
        { status: 400 }
      );

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

    const { data, error } = await supabase.from("propostas").insert(payload).select().single();
    if (error) throw error;

    return NextResponse.json({ message: "Proposta criada com sucesso!", data });
  } catch (err) {
    console.error("❌ POST /crm/propostas:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });

    // 🔹 Verifica dono ou admin
    const { data: me } = await service.from("profiles").select("id, role").eq("id", user.id).single();
    const { data: proposta } = await service.from("propostas").select("corretor_id").eq("id", id).single();

    const isOwner = proposta?.corretor_id === me.id;
    const isAdmin = me?.role === "admin";
    if (!isOwner && !isAdmin)
      return NextResponse.json({ error: "Sem permissão para editar." }, { status: 403 });

    // 🔹 Atualiza
    const { data, error } = await service
      .from("propostas")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Proposta atualizada com sucesso!", data });
  } catch (err) {
    console.error("❌ PATCH /crm/propostas:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    const { error } = await supabase.from("propostas").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ message: "Proposta removida com sucesso!" });
  } catch (err) {
    console.error("❌ DELETE /crm/propostas:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
