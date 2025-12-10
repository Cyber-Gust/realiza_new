import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * -----------------------------------------------------
 * GET  → Lista contratos ou retorna um específico
 * POST → Cria novo contrato
 * PATCH → Atualiza contrato existente
 * DELETE → Remove contrato
 * -----------------------------------------------------
 */

// ======================================================
// GET — agora retornando também o ENUM contrato_status
// ======================================================
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");
  const imovel_id = searchParams.get("imovel_id");
  const status = searchParams.get("status");
  const proprietario_id = searchParams.get("proprietario_id");
  const inquilino_id = searchParams.get("inquilino_id");

  let query = supabase
    .from("contratos")
    .select(`
        *,
        imoveis(*),
        proprietario:proprietario_id(*),
        inquilino:inquilino_id(*)
    `)
    .order("created_at", { ascending: false });

  if (id) query = query.eq("id", id);
  if (imovel_id) query = query.eq("imovel_id", imovel_id);
  if (status) query = query.eq("status", status);
  if (proprietario_id) query = query.eq("proprietario_id", proprietario_id);
  if (inquilino_id) query = query.eq("inquilino_id", inquilino_id);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ------------------------------------------------------
  // 🔥 Consulta o ENUM direto do PostgreSQL via RPC
  // ------------------------------------------------------
  const { data: statusEnum, error: enumErr } = await supabase.rpc(
    "get_contrato_status_enum"
  );

  if (enumErr) {
    console.error("Erro ao carregar ENUM contrato_status:", enumErr);
  }

  return NextResponse.json({
    data: id ? data[0] : data,
    status_enum: statusEnum || [], // ← AQUI vai pra UI
  });
}

// ======================================================
// POST – Criar contrato
// ======================================================
export async function POST(req) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user)
    return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });

  const body = await req.json();

  const payload = {
    ...body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("contratos")
    .insert(payload)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: "Contrato criado com sucesso!",
    data,
  });
}

// ======================================================
// PATCH – Atualizar contrato
// ======================================================
export async function PATCH(req) {
  const supabase = createServiceClient();
  const body = await req.json();

  const { id, ...updates } = body;
  if (!id)
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("contratos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: "Contrato atualizado!",
    data,
  });
}

// ======================================================
// DELETE – Remover contrato
// ======================================================
export async function DELETE(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const { error } = await supabase
    .from("contratos")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: "Contrato removido com sucesso!",
  });
}
