// src/app/api/imoveis/storage/route.js

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get("prefix") || "";

  try {
    const { data, error } = await supabase.storage.from("imoveis_media").list(prefix);
    if (error) throw error;

    const urls = data.map((file) => ({
      name: file.name,
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/imoveis_media/${prefix}${file.name}`,
    }));

    return NextResponse.json({ data: urls });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  const supabase = createServiceClient();

  try {
    const { name, prefix } = await req.json();
    if (!name) throw new Error("Nome do arquivo não informado");

    const { error } = await supabase.storage
      .from("imoveis_media")
      .remove([`${prefix || ""}${name}`]);

    if (error) throw error;

    return NextResponse.json({ data: "Removido com sucesso" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
