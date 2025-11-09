import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * 🔹 GET → Lista ou busca contrato específico
 * 🔹 POST → Cria novo contrato
 * 🔹 PATCH → Atualiza contrato existente
 * 🔹 DELETE → Remove contrato (admin)
 */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const imovel_id = searchParams.get("imovel_id");
  const status = searchParams.get("status");

  let query = supabase
  .from("contratos")
  .select(`
    id, tipo, data_inicio, data_fim, valor_acordado, taxa_administracao_percent,
    dia_vencimento_aluguel, indice_reajuste, status, documento_assinado_url,
    imovel_id, proprietario_id, inquilino_id,
    imoveis (id, titulo, endereco_bairro),
    proprietario:proprietario_id (id, nome, tipo, email, telefone),
    inquilino:inquilino_id (id, nome, tipo, email, telefone)
  `)
  .order("created_at", { ascending: false });

  if (id) query = query.eq("id", id);
  if (imovel_id) query = query.eq("imovel_id", imovel_id);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: id ? data[0] : data });
}

export async function POST(req) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });

  const body = await req.json();
  const payload = {
    ...body,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("contratos").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Contrato criado com sucesso!", data });
}

export async function PATCH(req) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const { data, error } = await supabase
    .from("contratos")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Contrato atualizado!", data });
}

export async function DELETE(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const { error } = await supabase.from("contratos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Contrato removido com sucesso!" });
}
