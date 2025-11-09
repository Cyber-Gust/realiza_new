import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("id, nome, telefone")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ GET /crm/agenda/leads/list:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
