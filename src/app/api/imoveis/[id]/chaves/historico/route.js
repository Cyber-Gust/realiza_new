import { NextResponse } from "next/server"; // ✅ import obrigatório
import { createServiceClient } from "@/lib/supabase/server"; // ✅ usa service role

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

    // 🔹 Busca os últimos registros de movimentação
    const { data, error } = await supabase
      .from("imoveis_chaves_historico")
      .select(`
        id,
        acao,
        localizacao,
        observacao,
        created_at,
        usuario_id,
        profiles:usuario_id (nome_completo)
      `)
      .eq("imovel_id", id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Erro GET /chaves/historico:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
