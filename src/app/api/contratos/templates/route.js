import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ===================================================
   GET → Lista todos templates
=================================================== */
export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("contrato_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

/* ===================================================
   POST → Cria template novo
=================================================== */
export async function POST(req) {
  const supabase = createServiceClient();
  const body = await req.json();

  const payload = {
    nome: body.nome,
    tipo: body.tipo,
    conteudo: body.conteudo,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("contrato_templates")
    .insert(payload)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: "Template criado com sucesso!",
    data,
  });
}

/* ===================================================
   PATCH → Atualiza template
=================================================== */
export async function PATCH(req) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from("contrato_templates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: "Template atualizado!",
    data,
  });
}

/* ===================================================
   DELETE → Remove template
=================================================== */
export async function DELETE(req) {
  const supabase = createServiceClient();
  const id = new URL(req.url).searchParams.get("id");

  const { error } = await supabase
    .from("contrato_templates")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: "Template removido!",
  });
}
