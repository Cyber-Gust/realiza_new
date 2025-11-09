import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function DELETE(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    const { error } = await supabase.from("agenda_eventos").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ message: "Evento removido com sucesso!" });
  } catch (err) {
    console.error("❌ DELETE /crm/agenda:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
