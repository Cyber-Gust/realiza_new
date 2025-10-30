import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const fileName = `${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("imoveis_media")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;
    return NextResponse.json({ message: "Upload concluído", name: fileName });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
