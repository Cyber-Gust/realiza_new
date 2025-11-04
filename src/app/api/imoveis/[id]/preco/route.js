import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// 🔹 GET → retorna histórico de preços (venda/locação)
export async function GET(req, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from("imoveis_precos")
      .select("id, created_at, tipo, valor")
      .eq("imovel_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// 🔹 POST → registra ajuste + atualiza valor no imóvel + retorna histórico atualizado
export async function POST(req, { params }) {
  const { id } = await params;
  const supabase = createServiceClient();

  try {
    const { tipo, valor, descricao, usuario_id } = await req.json(); // 👈 vem do front
    if (!usuario_id) throw new Error("Usuário não informado");
    if (!valor || Number(valor) <= 0) throw new Error("Valor inválido.");

    const field = tipo === "locacao" ? "preco_locacao" : "preco_venda";

    // Atualiza o valor no imóvel
    const { error: updateError } = await supabase
      .from("imoveis")
      .update({ [field]: valor })
      .eq("id", id);
    if (updateError) throw updateError;

    // Insere no histórico
    const { error: insertError } = await supabase.from("imoveis_precos").insert([
      {
        imovel_id: id,
        usuario_id, // 👈 agora vem direto do body
        tipo,
        valor,
        descricao: descricao || `Ajuste de ${tipo} para ${valor}`,
        created_at: new Date().toISOString(),
      },
    ]);
    if (insertError) throw insertError;

    // Retorna histórico atualizado
    const { data, error: fetchError } = await supabase
      .from("imoveis_precos")
      .select("id, created_at, tipo, valor, descricao, usuario_id")
      .eq("imovel_id", id)
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}