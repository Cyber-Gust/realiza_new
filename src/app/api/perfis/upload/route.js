//src/app/api/perfis/upload/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 🔹 Upload de foto de perfil
 * Rota: POST /api/perfis/upload
 * Body: { id: "uuid_do_perfil", file: base64 ou multipart }
 */
export async function POST(req) {
  const supabase = createServiceClient();

  try {
    // 1️⃣ Recebe o FormData
    const formData = await req.formData();
    const file = formData.get("file");
    const perfilId = formData.get("id");

    if (!file || !perfilId) {
      return NextResponse.json(
        { error: "Arquivo ou ID do perfil ausente." },
        { status: 400 }
      );
    }

    // 2️⃣ Gera nome e caminho padronizado
    const ext = file.name.split(".").pop();
    const path = `${perfilId}/avatar-${Date.now()}.${ext}`;

    // 3️⃣ Faz upload no bucket 'perfil_fotos'
    const { error: uploadError } = await supabase.storage
      .from("perfil_fotos")
      .upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (uploadError) throw uploadError;

    // 4️⃣ Pega a URL pública
    const { data } = supabase.storage
      .from("perfil_fotos")
      .getPublicUrl(path);

    const avatar_url = data.publicUrl;

    // 5️⃣ Atualiza o perfil no banco
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url, updated_at: new Date().toISOString() })
      .eq("id", perfilId);

    if (updateError) throw updateError;

    return NextResponse.json({ avatar_url });
  } catch (err) {
    console.error("❌ Erro upload perfil:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
