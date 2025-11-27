// src/app/api/imoveis/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// 🔥 HANDLERS CENTRALIZADOS
// ---------------------------------------------------------------------------

// GET – Lista imóveis ou arquivos do storage
async function handleGET(req, supabase) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // LISTAR STORAGE
  if (action === "storage") {
    let prefix = searchParams.get("prefix") || "";
    prefix = prefix.replace(/^\/+/, "");

    const { data, error } = await supabase.storage
      .from("imoveis_media")
      .list(prefix);

    if (error) throw error;

    const urls = data.map((file) => ({
      name: file.name,
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/imoveis_media/${prefix}${file.name}`,
    }));

    return { data: urls };
  }

  // LISTAR IMÓVEIS
  const id = searchParams.get("id");
  const tipo = searchParams.get("tipo");
  const status = searchParams.get("status");
  const cidade = searchParams.get("cidade");
  const preco_min = searchParams.get("preco_min");
  const preco_max = searchParams.get("preco_max");
  const disponibilidade = searchParams.get("disponibilidade");

  let query = supabase.from("imoveis").select("*", { count: "exact" });

  if (id) query = query.eq("id", id);
  if (tipo && tipo !== "all") query = query.eq("tipo", tipo);

  const normalizedStatus = !status || status === "" ? "all" : status;
  if (normalizedStatus !== "all") query = query.eq("status", normalizedStatus);

  if (cidade) query = query.ilike("endereco_cidade", `%${cidade}%`);
  if (preco_min) query = query.gte("preco_venda", Number(preco_min));
  if (preco_max) query = query.lte("preco_venda", Number(preco_max));

  if (disponibilidade && disponibilidade !== "all") {
    query = query.eq("disponibilidade", disponibilidade);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  return { data, count };
}

// ---------------------------------------------------------------------------
// POST – Criar imóvel ou gerar signedUrl
// ---------------------------------------------------------------------------
async function handlePOST(req, supabase) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const body = await req.json();

  // SIGNED URL
  if (action === "sign") {
    if (!body.path) throw new Error("Caminho do arquivo não informado.");

    const { data, error } = await supabase.storage
      .from("imoveis_media")
      .createSignedUploadUrl(body.path);

    if (error) throw error;

    const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/imoveis_media/${body.path}?token=${data.token}`;
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/imoveis_media/${body.path}`;

    return { data: { uploadUrl, publicUrl } };
  }
  // SIGN PARA COMPLIANCE
  if (action === "sign_compliance") {
    if (!body.path) throw new Error("Caminho do arquivo não informado.");

    const { data, error } = await supabase.storage
      .from("documentos_compliance")    // 👈 AQUI O BUCKET CERTO!
      .createSignedUploadUrl(body.path);

    if (error) throw error;

    const uploadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/documentos_compliance/${body.path}?token=${data.token}`;
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documentos_compliance/${body.path}`;

    return { data: { url: uploadUrl, publicUrl } };
  }

  // CRIAR IMÓVEL
  const required = ["proprietario_id", "tipo", "codigo_ref", "titulo", "slug"];
  for (const f of required) {
    if (!body[f]) throw new Error(`Campo obrigatório: ${f}`);
  }

  const VALID_STATUS = ["disponivel", "reservado", "alugado", "vendido", "inativo"];
  if (body.status && !VALID_STATUS.includes(body.status)) {
    throw new Error("Status inválido.");
  }

  const VALID_DISP = ["venda", "locacao", "ambos"];
  if (body.disponibilidade && !VALID_DISP.includes(body.disponibilidade)) {
    throw new Error("Disponibilidade inválida.");
  }

  const payload = {
    ...body,
    status: body.status || "disponivel",
    mobiliado: !!body.mobiliado,
    pet_friendly: !!body.pet_friendly,
    piscina: !!body.piscina,
    elevador: !!body.elevador,
    area_gourmet: !!body.area_gourmet,
    quartos: body.quartos ?? 0,
    banheiros: body.banheiros ?? 0,
    suites: body.suites ?? 0,
    vagas_garagem: body.vagas_garagem ?? 0,
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
// PUT – Atualizar imóvel (AJUSTADO)
// ---------------------------------------------------------------------------
async function handlePUT(req, supabase) {
  const body = await req.json();
  if (!body.id) throw new Error("ID é obrigatório.");

  const updateData = Object.fromEntries(
    Object.entries(body).filter(([_, v]) => v !== undefined)
  );

  const VALID_DISP = ["venda", "locacao", "ambos"];
  if (updateData.disponibilidade && !VALID_DISP.includes(updateData.disponibilidade)) {
    throw new Error("Disponibilidade inválida.");
  }

  const VALID_STATUS = ["disponivel", "reservado", "alugado", "vendido", "inativo"];
  if (updateData.status && !VALID_STATUS.includes(updateData.status)) {
    throw new Error("Status inválido.");
  }

  /// midias deve ser sempre array de objetos { url }
  if (updateData.midias !== undefined) {
    if (!Array.isArray(updateData.midias)) {
      throw new Error("Campo 'midias' deve ser um array.");
    }

    updateData.midias = updateData.midias.map((m) => {
      if (typeof m === "string") return { url: m };
      if (typeof m === "object" && m.url) return { url: m.url };
      throw new Error("Formato inválido em midias. Use { url }.");
    });
  }

  ["mobiliado", "pet_friendly", "piscina", "elevador", "area_gourmet"]
    .forEach(flag => {
      if (updateData[flag] !== undefined)
        updateData[flag] = !!updateData[flag];
    });

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

// ---------------------------------------------------------------------------
// DELETE – Deletar imóvel ou arquivo
// ---------------------------------------------------------------------------
async function handleDELETE(req, supabase) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const body = await req.json();

  if (action === "storage") {
    if (!body.name) throw new Error("Nome do arquivo não informado.");

    const fullPath = `${body.prefix}${body.name}`;

    const { error } = await supabase.storage
      .from("imoveis_media")
      .remove([fullPath]);

    if (error) throw error;

    return { data: "Arquivo removido" };
  }

  if (!body.id) throw new Error("ID do imóvel obrigatório.");

  if (body.soft) {
    const { data, error } = await supabase
      .from("imoveis")
      .update({
        status: "inativo",
        updated_at: new Date().toISOString(),
      })
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
// EXPORTAÇÕES
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
