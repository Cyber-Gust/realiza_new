import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ============================================================================
 🔥 UTIL: Busca documentos + gera URLs temporárias
============================================================================ */
async function listDocs(supabase, imovelId) {
  const { data, error } = await supabase
    .from("imoveis_compliance")
    .select("*")
    .eq("imovel_id", imovelId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const docs = await Promise.all(
    (data || []).map(async (doc) => {
      const signed = await supabase.storage
        .from("documentos_compliance")
        .createSignedUrl(doc.path, 3600);

      return {
        ...doc,
        url: signed.data?.signedUrl || null,
      };
    })
  );

  return docs;
}

/* ============================================================================
 🔥 GET — listar documentos
============================================================================ */
export async function GET(req, context) {
  try {
    const params = await context.params; // <- OBRIGATÓRIO NO NEXT 14
    const imovelId = params.id;

    const supabase = createServiceClient();
    const docs = await listDocs(supabase, imovelId);

    return NextResponse.json({ data: docs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

/* ============================================================================
 🔥 POST — adicionar documento
============================================================================ */
export async function POST(req, context) {
  try {
    const params = await context.params;
    const imovelId = params.id;

    const { doc } = await req.json();
    if (!doc) throw new Error("Documento inválido.");

    const supabase = createServiceClient();

    const { error } = await supabase.from("imoveis_compliance").insert({
      id: doc.id,
      imovel_id: imovelId,
      tipo: doc.tipo,
      validade: doc.validade,
      path: doc.path,
    });

    if (error) throw error;

    return NextResponse.json({ message: "Documento adicionado." });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

/* ============================================================================
 🔥 PUT — atualizar validade
============================================================================ */
export async function PUT(req, context) {
  try {
    const params = await context.params;
    const imovelId = params.id;

    const { doc } = await req.json();
    if (!doc?.id) throw new Error("Documento inválido.");

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("imoveis_compliance")
      .update({ validade: doc.validade })
      .eq("id", doc.id)
      .eq("imovel_id", imovelId);

    if (error) throw error;

    return NextResponse.json({ message: "Validade atualizada." });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

/* ============================================================================
 🔥 DELETE — remover documento
============================================================================ */
export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const imovelId = params.id;

    const { doc_id, path } = await req.json();
    if (!doc_id) throw new Error("ID do documento é obrigatório.");

    const supabase = createServiceClient();

    // deletar arquivo
    if (path) {
      await supabase.storage
        .from("documentos_compliance")
        .remove([path]);
    }

    // deletar BD
    const { error } = await supabase
      .from("imoveis_compliance")
      .delete()
      .eq("id", doc_id)
      .eq("imovel_id", imovelId);

    if (error) throw error;

    return NextResponse.json({ message: "Documento removido." });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
