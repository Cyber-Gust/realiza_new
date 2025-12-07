import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const supabase = createServiceClient();
    const { path } = await req.json();

    if (!path) {
      return NextResponse.json(
        { error: "path é obrigatório" },
        { status: 400 }
      );
    }

    // Gera URL temporária de 1 hora
    const { data, error } = await supabase.storage
      .from("documentos_contratos")
      .createSignedUrl(path, 60 * 60);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      expiresIn: 3600,
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
