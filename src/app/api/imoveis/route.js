// src/app/api/imoveis/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import slugify from "slugify";

// ---------------------------------------------------------------------------
// 🔥 HANDLERS CENTRALIZADOS
// ---------------------------------------------------------------------------

/* ============================================================================
   GET
============================================================================ */
async function handleGET(req, supabase) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  /* ---------------- STORAGE LIST ---------------- */
  if (action === "storage") {
    let prefix = searchParams.get("prefix") || "";
    prefix = prefix.replace(/^\/+/, "");

    const { data, error } = await supabase
      .storage
      .from("imoveis_media")
      .list(prefix);

    if (error) throw error;

    return {
      data: (data || []).map(file => ({
        name: file.name,
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/imoveis_media/${prefix}${file.name}`
      }))
    };
  }

  /* ---------------- IMÓVEIS LIST ---------------- */
  const sanitize = v =>
    !v || ["undefined", "null", "false"].includes(v) ? null : v;

  const filters = {
    id: sanitize(searchParams.get("id")),
    tipo: sanitize(searchParams.get("tipo")),
    status: sanitize(searchParams.get("status")),
    cidade: sanitize(searchParams.get("cidade")),
    bairro: sanitize(searchParams.get("bairro")),
    rua: sanitize(searchParams.get("rua")),
    cep: sanitize(searchParams.get("cep")),
    corretor_id: sanitize(searchParams.get("corretor_id")),
    proprietario_id: sanitize(searchParams.get("proprietario_id")),
    disponibilidade: sanitize(searchParams.get("disponibilidade"))
  };

  let query = supabase.from("imoveis").select("*", { count: "exact" });

  if (filters.id) query = query.eq("id", filters.id);
  if (filters.tipo) query = query.eq("tipo", filters.tipo);
  if (filters.status && filters.status !== "all")
    query = query.eq("status", filters.status);

  if (filters.cidade) query = query.eq("endereco_cidade", filters.cidade);
  if (filters.bairro) query = query.eq("endereco_bairro", filters.bairro);
  if (filters.rua) query = query.ilike("endereco_rua", `%${filters.rua}%`);
  if (filters.cep) query = query.eq("endereco_cep", filters.cep);
  if (filters.corretor_id)
    query = query.eq("corretor_id", filters.corretor_id);
  if (filters.proprietario_id)
    query = query.eq("proprietario_id", filters.proprietario_id);
  if (filters.disponibilidade && filters.disponibilidade !== "all")
    query = query.eq("disponibilidade", filters.disponibilidade);

  query = query.order("created_at", { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  return { data, count };
}

// ---------------------------------------------------------------------------
// POST – Criar imóvel
// ---------------------------------------------------------------------------
async function handlePOST(req, supabase) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const body = await req.json();

  if (action === "sign") {
    if (!body.path) throw new Error("Caminho do arquivo não informado.");

    const { data, error } = await supabase.storage
      .from("imoveis_media")
      .createSignedUploadUrl(body.path);

    if (error) throw error;

    return {
      data: {
        uploadUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/imoveis_media/${body.path}?token=${data.token}`,
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/imoveis_media/${body.path}`,
      },
    };
  }

  if (action === "sign_compliance") {
    if (!body.path) throw new Error("Caminho do arquivo não informado.");

    const { data, error } = await supabase.storage
      .from("documentos_compliance")
      .createSignedUploadUrl(body.path);

    if (error) throw error;

    return {
      data: {
        uploadUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/documentos_compliance/${body.path}?token=${data.token}`,
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documentos_compliance/${body.path}`,
      },
    };
  }

  const required = ["proprietario_id", "tipo", "codigo_ref", "titulo"];
  for (const f of required) {
    if (!body[f]) throw new Error(`Campo obrigatório: ${f}`);
  }

  const VALID_STATUS = [
    "disponivel",
    "reservado",
    "alugado",
    "vendido",
    "inativo",
  ];
  if (body.status && !VALID_STATUS.includes(body.status)) {
    throw new Error("Status inválido.");
  }

  const VALID_DISP = ["venda", "locacao", "ambos"];
  if (body.disponibilidade && !VALID_DISP.includes(body.disponibilidade)) {
    throw new Error("Disponibilidade inválida.");
  }

  let midias = null;
  if (Array.isArray(body.midias)) {
    midias = body.midias.map((m) => {
      if (typeof m === "string") return { url: m };
      if (typeof m === "object" && m.url) return { url: m.url };
      throw new Error("Formato inválido em midias.");
    });
  }

  function calcComissaoVenda(preco, percent) {
    if (!preco || !percent) return null;
    return (preco * percent) / 100;
  }

  function calcComissaoLocacao(preco, percent) {
    if (!preco || !percent) return null;
    return (preco * percent) / 100;
  }
  const slug = slugify(
    `${body.titulo}-${body.codigo_ref}`,
    {
      lower: true,
      strict: true,
      trim: true,
    }
  );

  const payload = {
    ...body,
    slug,
    midias,
    comissao_venda_valor: calcComissaoVenda(
      body.preco_venda,
      body.comissao_venda_percent
    ),
    comissao_locacao_valor: calcComissaoLocacao(
      body.preco_locacao,
      body.comissao_locacao_percent
    ),
    aceita_permuta: !!body.aceita_permuta,
    mobiliado: !!body.mobiliado,
    pet_friendly: !!body.pet_friendly,
    piscina: !!body.piscina,
    elevador: !!body.elevador,
    area_gourmet: !!body.area_gourmet,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("imoveis")
    .insert([payload])
    .select("id")
    .single();

  if (error) throw error;

  return { data };
}

// ---------------------------------------------------------------------------
// PUT – Atualizar imóvel
// ---------------------------------------------------------------------------
async function handlePUT(req, supabase) {
  const body = await req.json();
  if (!body.id) throw new Error("ID é obrigatório.");

  const updateData = Object.fromEntries(
    Object.entries(body).filter(([_, v]) => v !== undefined)
  );

  function calcComissaoVenda(preco, percent) {
    if (!preco || !percent) return null;
    return (preco * percent) / 100;
  }

  function calcComissaoLocacao(preco, percent) {
    if (!preco || !percent) return null;
    return (preco * percent) / 100;
  }

  if (
    updateData.preco_venda !== undefined ||
    updateData.comissao_venda_percent !== undefined
  ) {
    updateData.comissao_venda_valor = calcComissaoVenda(
      updateData.preco_venda,
      updateData.comissao_venda_percent
    );
  }

  if (
    updateData.preco_locacao !== undefined ||
    updateData.comissao_locacao_percent !== undefined
  ) {
    updateData.comissao_locacao_valor = calcComissaoLocacao(
      updateData.preco_locacao,
      updateData.comissao_locacao_percent
    );
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("imoveis")
    .update(updateData)
    .eq("id", body.id)
    .select()
    .single();

  if (error) throw error;

  return { data };
}

/* ============================================================================
   DELETE
============================================================================ */
async function handleDELETE(req, supabase) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const body = await req.json();

  /* ---------------- DELETE STORAGE FILE ---------------- */
  if (action === "storage") {
    if (!body.name || !body.prefix)
      throw new Error("Arquivo ou prefixo não informado.");

    const path = `${body.prefix}${body.name}`.replace(/^\/+/, "");

    const { error } = await supabase
      .storage
      .from("imoveis_media")
      .remove([path]);

    if (error) throw error;
    return { success: true };
  }

  /* ---------------- DELETE IMÓVEL ---------------- */
  if (!body.id) throw new Error("ID obrigatório.");

  if (body.soft) {
    const { data, error } = await supabase
      .from("imoveis")
      .update({ status: "inativo", updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  }

  const { error } = await supabase
    .from("imoveis")
    .delete()
    .eq("id", body.id);

  if (error) throw error;
  return { success: true };
}

// ---------------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------------
export async function GET(req) {
  try {
    const supabase = createServiceClient();
    return NextResponse.json(await handleGET(req, supabase));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    const supabase = createServiceClient();
    return NextResponse.json(await handlePOST(req, supabase));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(req) {
  try {
    const supabase = createServiceClient();
    return NextResponse.json(await handlePUT(req, supabase));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  try {
    const supabase = createServiceClient();
    return NextResponse.json(await handleDELETE(req, supabase));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
