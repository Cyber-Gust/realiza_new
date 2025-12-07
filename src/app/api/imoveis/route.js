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
  function sanitize(value) {
    if (!value) return null;
    if (value === "undefined") return null;
    if (value === "null") return null;
    if (value === "false") return null;
    return value;
  }

  const id = sanitize(searchParams.get("id"));
  const tipo = sanitize(searchParams.get("tipo"));
  const status = sanitize(searchParams.get("status"));
  const cidade = sanitize(searchParams.get("cidade"));
  const preco_min = sanitize(searchParams.get("preco_min"));
  const preco_max = sanitize(searchParams.get("preco_max"));
  const disponibilidade = sanitize(searchParams.get("disponibilidade"));

  const bairro = sanitize(searchParams.get("bairro"));
  const rua = sanitize(searchParams.get("rua"));
  const cep = sanitize(searchParams.get("cep"));

  const corretor_id = sanitize(searchParams.get("corretor_id"));
  const proprietario_id = sanitize(searchParams.get("proprietario_id"));

  let query = supabase.from("imoveis").select("*", { count: "exact" });

  if (id) query = query.eq("id", id);

  if (tipo) query = query.eq("tipo", tipo);

  const normalizedStatus = !status ? null : status;
  if (normalizedStatus && normalizedStatus !== "all") {
    query = query.eq("status", normalizedStatus);
  }

  if (cidade) query = query.ilike("endereco_cidade", `%${cidade}%`);
  if (bairro) query = query.ilike("endereco_bairro", `%${bairro}%`);
  if (rua) query = query.ilike("endereco_rua", `%${rua}%`);
  if (cep) query = query.eq("endereco_cep", cep);

  if (corretor_id) query = query.eq("corretor_id", Number(corretor_id));
  if (proprietario_id) query = query.eq("proprietario_id", Number(proprietario_id));

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
// POST – Criar imóvel (com novas regras)
// ---------------------------------------------------------------------------
async function handlePOST(req, supabase) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const body = await req.json();

  // ------------------------------
  // 1) SIGNED URL PARA MÍDIAS
  // ------------------------------
  if (action === "sign") {
    if (!body.path) throw new Error("Caminho do arquivo não informado.");

    const { data, error } = await supabase.storage
      .from("imoveis_media")
      .createSignedUploadUrl(body.path);

    if (error) throw error;

    return {
      data: {
        uploadUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/imoveis_media/${body.path}?token=${data.token}`,
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/imoveis_media/${body.path}`
      }
    };
  }

  // ------------------------------
  // 2) SIGNED URL PARA COMPLIANCE
  // ------------------------------
  if (action === "sign_compliance") {
    if (!body.path) throw new Error("Caminho do arquivo não informado.");

    const { data, error } = await supabase.storage
      .from("documentos_compliance")
      .createSignedUploadUrl(body.path);

    if (error) throw error;

    return {
      data: {
        uploadUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/documentos_compliance/${body.path}?token=${data.token}`,
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documentos_compliance/${body.path}`
      }
    };
  }

  // ------------------------------
  // 3) CRIAÇÃO DO IMÓVEL
  // ------------------------------
  const required = ["proprietario_id", "tipo", "codigo_ref", "slug", "titulo"];
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

  // ------------------------------
  // 4) SANITIZAR MÍDIAS
  // ------------------------------
  let midias = null;
  if (Array.isArray(body.midias)) {
    midias = body.midias.map((m) => {
      if (typeof m === "string") return { url: m };
      if (typeof m === "object" && m.url) return { url: m.url };
      throw new Error("Formato inválido em midias. Use { url }.");
    });
  }

  // ------------------------------
  // 5) COMISSIONAMENTO AUTOMÁTICO
  // ------------------------------
  function calcComissaoVenda(tipoImovel, preco, percent) {
    if (!preco || !percent) return null;
    return (preco * percent) / 100;
  }

  function calcComissaoLocacao(preco, percent) {
    if (!preco || !percent) return null;
    return (preco * percent) / 100;
  }

  const comissao_venda_valor = calcComissaoVenda(
    body.tipo,
    body.preco_venda,
    body.comissao_venda_percent
  );

  const comissao_locacao_valor = calcComissaoLocacao(
    body.preco_locacao,
    body.comissao_locacao_percent
  );

  // ------------------------------
  // 6) PAYLOAD FINAL
  // ------------------------------
  const payload = {
    ...body,
    midias,
    caracteristicas_fisicas: body.caracteristicas_fisicas || null,
    caracteristicas_extras: body.caracteristicas_extras || null,
    situacao_documentacao: body.situacao_documentacao || null,
    aceita_permuta: !!body.aceita_permuta,

    area_construida: body.area_construida ?? null,
    testada: body.testada ?? null,
    profundidade: body.profundidade ?? null,

    comissao_venda_percent: body.comissao_venda_percent ?? null,
    comissao_venda_valor,

    comissao_locacao_percent: body.comissao_locacao_percent ?? null,
    comissao_locacao_valor,

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
// PUT – Atualizar imóvel (com tudo atualizado)
// ---------------------------------------------------------------------------
async function handlePUT(req, supabase) {
  const body = await req.json();
  if (!body.id) throw new Error("ID é obrigatório.");

  const updateData = Object.fromEntries(
    Object.entries(body).filter(([_, v]) => v !== undefined)
  );

  const VALID_STATUS = ["disponivel", "reservado", "alugado", "vendido", "inativo"];
  if (updateData.status && !VALID_STATUS.includes(updateData.status)) {
    throw new Error("Status inválido.");
  }

  const VALID_DISP = ["venda", "locacao", "ambos"];
  if (updateData.disponibilidade && !VALID_DISP.includes(updateData.disponibilidade)) {
    throw new Error("Disponibilidade inválida.");
  }

  // ------------------------------
  // MÍDIAS SANITIZADAS
  // ------------------------------
  if (updateData.midias !== undefined) {
    if (!Array.isArray(updateData.midias)) {
      throw new Error("Campo 'midias' deve ser um array.");
    }

    updateData.midias = updateData.midias.map((m) => {
      if (typeof m === "string") return { url: m };
      if (typeof m === "object" && m.url) return { url: m.url };
      throw new Error("Formato inválido em midias.");
    });
  }

  // ------------------------------
  // FLAGS BOOLEANAS
  // ------------------------------
  ["mobiliado", "pet_friendly", "piscina", "elevador", "area_gourmet", "aceita_permuta"]
    .forEach(flag => {
      if (updateData[flag] !== undefined)
        updateData[flag] = !!updateData[flag];
    });

  // ------------------------------
  // COMISSIONAMENTO RE-CALCULADO
  // ------------------------------
  function calcComissaoVenda(tipoImovel, preco, percent) {
    if (!preco || !percent) return null;
    return (preco * percent) / 100;
  }

  function calcCommissaoLocacao(preco, percent) {
    if (!preco || !percent) return null;
    return (preco * percent) / 100;
  }

  if (
    updateData.preco_venda !== undefined ||
    updateData.comissao_venda_percent !== undefined
  ) {
    updateData.comissao_venda_valor = calcComissaoVenda(
      updateData.tipo,
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
