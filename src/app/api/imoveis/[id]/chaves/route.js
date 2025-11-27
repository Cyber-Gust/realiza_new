import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server"; // ✔️ agora usando o client certo

/* =========================================================
   GET — Buscar localização + histórico
========================================================= */
export async function GET(req, context) {
  const params = await context.params;
  const { id } = params;

  if (!id)
    return NextResponse.json({ error: "ID do imóvel não fornecido." }, { status: 400 });

  const supabase = createServiceClient(); // ✔️ bypass RLS, sem cookies

  const { data: imovel, error: locError } = await supabase
    .from("imoveis")
    .select("chaves_localizacao")
    .eq("id", id)
    .single();

  if (locError)
    return NextResponse.json({ error: locError.message }, { status: 400 });

  const { data: historico, error: histError } = await supabase
    .from("imoveis_chaves_historico")
    .select(`
      id,
      acao,
      localizacao,
      observacao,
      created_at,
      profiles:usuario_id ( nome_completo )
    `)
    .eq("imovel_id", id)
    .order("created_at", { ascending: false });

  if (histError)
    return NextResponse.json({ error: histError.message }, { status: 400 });

  return NextResponse.json({
    localizacao: imovel?.chaves_localizacao ?? "Não informado",
    historico: historico ?? [],
  });
}

/* =========================================================
   PUT — Atualizar chave + registrar histórico
========================================================= */
export async function PUT(req, context) {
  const params = await context.params;
  const { id } = params;

  if (!id)
    return NextResponse.json({ error: "ID do imóvel não fornecido." }, { status: 400 });

  const body = await req.json();
  const { localizacao, acao, observacao, usuario_id } = body;

  if (!localizacao)
    return NextResponse.json({ error: "Localização obrigatória." }, { status: 400 });

  if (!usuario_id)
    return NextResponse.json({ error: "Usuário não enviado." }, { status: 400 });

  const supabase = createServiceClient(); // ✔️ administrativo, sem cookies

  const { error: updateError } = await supabase
    .from("imoveis")
    .update({
      chaves_localizacao: localizacao,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 400 });

  const { error: insertError } = await supabase
    .from("imoveis_chaves_historico")
    .insert({
      imovel_id: id,
      usuario_id,
      acao: acao || "movimentacao",
      localizacao,
      observacao: observacao || null,
    });

  if (insertError)
    return NextResponse.json({ error: insertError.message }, { status: 400 });

  return NextResponse.json({ message: "Atualizado com sucesso" });
}
