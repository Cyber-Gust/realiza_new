import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  try {
    const { data, error } = await supabase
      .from("imoveis")
      .select("id, titulo, endereco_bairro, status")
      .in("status", ["disponivel", "reservado"])
      .order("titulo", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ GET /crm/agenda/imoveis/list:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
