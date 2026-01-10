// src/app/api/perfis/upload/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Upload de foto de perfil para:
 *  - Equipe (profiles)
 *  - Personas (proprietário, inquilino)
 *  - Clientes (tipo = cliente)
 *
 * Body (FormData):
 *   - id: uuid do perfil
 *   - type: equipe | personas | clientes
 *   - file: File
 */
export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const perfilId = formData.get("id");
    const type = formData.get("type") || "equipe";

    if (!file || !perfilId) {
      return NextResponse.json(
        { error: "Arquivo e ID são obrigatórios." },
        { status: 400 }
      );
    }

    // =============================
    // EXTENSÃO SEGURA
    // =============================
    const originalName = file.name || "foto.jpg";
    const ext = originalName.split(".").pop() || "jpg";

    const path = `${type}/${perfilId}/avatar-${Date.now()}.${ext}`;

    // =============================
    // UPLOAD NO STORAGE
    // =============================
    const { error: uploadError } = await supabase.storage
      .from("perfil_fotos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (uploadError) throw uploadError;

    // =============================
    // URL pública
    // =============================
    const { data: publicData } = supabase.storage
      .from("perfil_fotos")
      .getPublicUrl(path);

    const avatar_url = publicData.publicUrl;

    // =============================
    // UPDATE NA TABELA CORRETA
    // =============================
    let table = "profiles";
    if (type === "personas" || type === "clientes") {
      table = "personas";
    }

    const { error: updateError } = await supabase
      .from(table)
      .update({
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", perfilId);

    if (updateError) throw updateError;

    return NextResponse.json({
      avatar_url,
      message: "Upload realizado com sucesso!",
    });
  } catch (err) {
    console.error("❌ Erro upload perfil:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
