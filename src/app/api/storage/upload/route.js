import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 📦 API — Upload universal (Service Role)
 * - Sanitiza nome do arquivo
 * - Suporta múltiplos buckets
 * - Retorna URL pública
 */
export async function POST(req) {
  try {
    const supabase = createServiceClient();
    const formData = await req.formData();

    const file = formData.get("file");
    const bucket = formData.get("bucket") || "documentos_vistorias";
    const path = formData.get("path") || "";

    if (!file || !file.name) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // 🧹 Sanitiza nome do arquivo: remove espaços, acentos e caracteres especiais
    const sanitize = (str) =>
      str
        .normalize("NFD") // remove acentos
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.\-]/g, "_"); // mantém apenas letras, números, _ e .

    const safeFileName = sanitize(file.name);
    const safePath = path
      ? `${sanitize(path.split("/")[0])}/${safeFileName}`
      : safeFileName;

    // 💾 Upload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(safePath, file, { cacheControl: "3600", upsert: true });

    if (error) throw error;

    // 🌎 URL pública
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return NextResponse.json({
      message: "Upload realizado com sucesso.",
      bucket,
      path: data.path,
      url: publicData.publicUrl,
    });
  } catch (err) {
    console.error("❌ Erro em /api/storage/upload:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
