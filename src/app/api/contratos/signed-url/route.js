import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const supabase = createServiceClient();
    const { path } = await req.json();

    // ============================================================
    // Validação inicial
    // ============================================================
    if (!path || typeof path !== "string") {
      return NextResponse.json(
        { error: "O campo 'path' é obrigatório e deve ser uma string." },
        { status: 400 }
      );
    }

    // Segurança contra path traversal
    if (path.includes("..")) {
      return NextResponse.json(
        { error: "Path inválido." },
        { status: 400 }
      );
    }

    // Normaliza caminhos
    const normalizedPath = path.replace(/^\/+/, "");

    // ============================================================
    // Gera URL temporária (1h)
    // ============================================================
    const { data, error } = await supabase.storage
      .from("documentos_contratos")
      .createSignedUrl(normalizedPath, 60 * 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        {
          error:
            error?.message ||
            "Falha ao gerar signed URL para o arquivo solicitado.",
        },
        { status: 500 }
      );
    }

    // ============================================================
    // Sucesso
    // ============================================================
    return NextResponse.json({
      message: "Signed URL gerada com sucesso.",
      signedUrl: data.signedUrl,
      expiresIn: 3600,
      path: normalizedPath,
    });

  } catch (err) {
    return NextResponse.json(
      {
        error: err?.message || "Erro interno ao gerar signed URL.",
      },
      { status: 500 }
    );
  }
}
