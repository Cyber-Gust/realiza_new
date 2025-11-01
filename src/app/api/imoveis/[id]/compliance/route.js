import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from("imoveis")
      .select("documentos_compliance_json")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json({ data: data?.documentos_compliance_json || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();
  

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const tipo = formData.get("tipo");
    const validade = formData.get("validade");

    if (!file) throw new Error("Arquivo não enviado");

    const fileName = `${id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documentos_compliance")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("documentos_compliance")
      .getPublicUrl(fileName);

    const doc = {
      id: crypto.randomUUID(),
      tipo,
      validade,
      url: publicUrl.publicUrl,
      path: fileName,
      created_at: new Date().toISOString(),
    };

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

    return NextResponse.json({ data: docs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();


  try {
    const { id: targetId, url } = await req.json();
    const { data: imovel } = await supabase
      .from("imoveis")
      .select("documentos_compliance_json")
      .eq("id", id)
      .single();

    let docs = imovel?.documentos_compliance_json || [];
    const doc = docs.find((d) => d.id === targetId || d.url === url);

    if (doc?.path) {
      await supabase.storage.from("documentos_compliance").remove([doc.path]);
    }

    docs = docs.filter((d) => d.id !== targetId && d.url !== url);

    await supabase.from("imoveis").update({ documentos_compliance_json: docs }).eq("id", id);

    return NextResponse.json({ data: docs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
