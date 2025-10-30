import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    const data = await req.json();
    const { error } = await supabase.from("imoveis").insert([data]);
    if (error) throw error;
    return NextResponse.json({ message: "Imóvel criado com sucesso" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
