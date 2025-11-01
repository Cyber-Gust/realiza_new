import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 🔹 GET: status atual e histórico leve
export async function GET(req, { params }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("imoveis")
      .select("chaves_localizacao")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 POST: atualiza localização atual e (opcional) histórico embutido
export async function POST(req, { params }) {
  try {
    const supabase = createClient();
    const body = await req.json();

    if (!body.localizacao)
      return NextResponse.json({ error: "Localização é obrigatória." }, { status: 400 });

    const { data, error } = await supabase
      .from("imoveis")
      .update({
        chaves_localizacao: body.localizacao,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
