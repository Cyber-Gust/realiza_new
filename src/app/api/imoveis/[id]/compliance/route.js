// src/app/api/imoveis/[id]/compliance/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ============================================================
   ✅ GET — Lista documentos com signed URLs (privado)
   ============================================================ */
export async function GET(req, context) {
  const { id } = await context.params;
  const supabase = createServiceClient();

  try {
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Busca documentos no imóvel
    const { data, error } = await supabase
      .from("imoveis")
      .select("documentos_compliance_json")
      .eq("id", id)
      .single();

    if (error) throw error;

    const docs = Array.isArray(data?.documentos_compliance_json)
      ? data.documentos_compliance_json
      : [];

    // Gera signed URLs temporárias (5 min)
    const signedDocs = await Promise.all(
      docs.map(async (d) => {
        if (!d.path) return d;
        const { data: signed, error: signedError } = await supabase.storage
          .from("documentos_compliance")
          .createSignedUrl(d.path, 60 * 5); // 5 min
        if (signedError) {
          console.warn("Erro ao gerar signed URL:", signedError.message);
          return d;
        }
        return { ...d, url: signed?.signedUrl };
      })
    );

    return NextResponse.json({ data: signedDocs });
  } catch (err) {
    console.error("GET /compliance error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

/* ============================================================
   ✅ POST — Upload de novo documento
   ============================================================ */
export async function POST(req, context) {
  const { id } = await context.params;
  const supabase = createServiceClient();

  try {
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const tipo = formData.get("tipo");
    const validade = formData.get("validade");

    if (!file) throw new Error("Arquivo não enviado");

    // 🔹 Sanitiza nome de arquivo
    const safeName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    const fileName = `${id}/${Date.now()}_${safeName}`;

    // 🔹 Faz upload no bucket privado
    const { error: uploadError } = await supabase.storage
      .from("documentos_compliance")
      .upload(fileName, file, { upsert: false });

    if (uploadError) throw uploadError;

    // 🔹 Cria objeto documento
    const doc = {
      id: crypto.randomUUID(),
      tipo,
      validade,
      path: fileName,
      created_at: new Date().toISOString(),
    };

    // 🔹 Atualiza o imóvel com o novo documento
    const { data: current } = await supabase
      .from("imoveis")
      .select("documentos_compliance_json")
      .eq("id", id)
      .single();

    const docs = Array.isArray(current?.documentos_compliance_json)
      ? [...current.documentos_compliance_json, doc]
      : [doc];

    const { error: updateError } = await supabase
      .from("imoveis")
      .update({ documentos_compliance_json: docs })
      .eq("id", id);

    if (updateError) throw updateError;

    // 🔹 Retorna lista atualizada com signed URLs
    const signedDocs = await Promise.all(
      docs.map(async (d) => {
        if (!d.path) return d;
        const { data: signed } = await supabase.storage
          .from("documentos_compliance")
          .createSignedUrl(d.path, 60 * 5);
        return { ...d, url: signed?.signedUrl };
      })
    );

    return NextResponse.json({ data: signedDocs });
  } catch (err) {
    console.error("POST /compliance error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

/* ============================================================
   ✅ DELETE — Remove documento e atualiza imóvel
   ============================================================ */
export async function DELETE(req, context) {
  const { id } = await context.params;
  const supabase = createServiceClient();

  try {
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { id: targetId, url } = await req.json();

    // Busca documentos atuais
    const { data: imovel, error: selectError } = await supabase
      .from("imoveis")
      .select("documentos_compliance_json")
      .eq("id", id)
      .single();

    if (selectError) throw selectError;

    let docs = imovel?.documentos_compliance_json || [];
    const doc = docs.find((d) => d.id === targetId || d.url === url);

    // Remove do Storage se existir path
    if (doc?.path) {
      const { error: removeError } = await supabase.storage
        .from("documentos_compliance")
        .remove([doc.path]);
      if (removeError) throw removeError;
    }

    // Remove do array JSON
    docs = docs.filter((d) => d.id !== targetId && d.url !== url);

    const { error: updateError } = await supabase
      .from("imoveis")
      .update({ documentos_compliance_json: docs })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ data: docs });
  } catch (err) {
    console.error("DELETE /compliance error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
