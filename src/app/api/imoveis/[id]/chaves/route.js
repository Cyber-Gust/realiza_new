import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// 🔹 GET: busca a localização atual da chave
export async function GET(req, context) {
  try {
    const params = await context.params;
    const id = params?.id;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "ID do imóvel inválido ou não informado." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("imoveis")
      .select("chaves_localizacao")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Erro GET /chaves:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 POST: atualiza localização e registra histórico
export async function POST(req, context) {
  try {
    const params = await context.params;
    const id = params?.id;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "ID do imóvel inválido ou não informado." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { localizacao, acao = "outro", observacao } = body;

    if (!localizacao) {
      return NextResponse.json(
        { error: "Localização é obrigatória." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 🔹 Atualiza o imóvel
    const { error: updateError } = await supabase
      .from("imoveis")
      .update({
        chaves_localizacao: localizacao,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // 🔹 Registra no histórico
    const { error: histError } = await supabase
      .from("imoveis_chaves_historico")
      .insert({
        imovel_id: id,
        usuario_id: null, // depois ligaremos ao usuário real
        acao,
        localizacao,
        observacao,
      });

    if (histError) throw histError;

    return NextResponse.json({
      message: "Localização atualizada e histórico registrado com sucesso!",
    });
  } catch (err) {
    console.error("Erro POST /chaves:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
