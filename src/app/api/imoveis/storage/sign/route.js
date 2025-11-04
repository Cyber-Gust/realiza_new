// src/app/api/imoveis/storage/sign/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const { path } = await req.json();
    if (!path) throw new Error("Caminho do arquivo não informado.");

    const { data, error } = await supabase.storage
      .from("imoveis_media")
      .createSignedUploadUrl(path);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
