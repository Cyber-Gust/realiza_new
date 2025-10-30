import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function DELETE(req) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  const { error } = await supabase.storage.from("imoveis_media").remove([name]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Arquivo removido com sucesso" });
}
