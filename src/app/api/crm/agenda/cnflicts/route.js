import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const { profile_id, inicio, fim } = Object.fromEntries(searchParams.entries());

  try {
    const { data, error } = await supabase
      .from("agenda_eventos")
      .select("id, titulo")
      .eq("profile_id", profile_id)
      .lte("data_inicio", fim)
      .gte("data_fim", inicio);

    if (error) throw error;
    return NextResponse.json({ conflito: data.length > 0, data });
  } catch (err) {
    console.error("❌ GET /crm/agenda/conflicts:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
