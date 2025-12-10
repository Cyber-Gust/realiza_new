import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    const supabase = createServiceClient();

    // Recebe o FormData
    const formData = await req.formData();
    const file = formData.get("file");
    const contrato_id = formData.get("contrato_id");
    const document_type = formData.get("document_type");

    console.log("📎 document_type recebido:", document_type);
    console.log("📎 contrato_id:", contrato_id);
    console.log("📎 file:", file?.name);

    if (!file || !contrato_id || !document_type) {
      return NextResponse.json(
        { error: "file, contrato_id e document_type são obrigatórios" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sempre salvar apenas o PATH, não a URL
    const filename = `contratos/${contrato_id}/${document_type}-${Date.now()}-${file.name}`;


    // Upload → bucket privado
    const { error: uploadErr } = await supabase.storage
      .from("documentos_contratos")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json(
        { error: uploadErr.message },
        { status: 500 }
      );
    }

    // Cria signed URL (expira em 1 hora)
    const { data: signedUrlData, error: signedErr } =
      await supabase.storage
        .from("documentos_contratos")
        .createSignedUrl(filename, 60 * 60);

    if (signedErr) {
      return NextResponse.json(
        { error: signedErr.message },
        { status: 500 }
      );
    }

    // Mapeamento de campos do banco
    const map = {
      assinado: "documento_assinado_path",
      renovacao: "renovacao_documento_path",
      rescisao: "rescisao_documento_path",
      aditivo: "documento_aditivo_path",
      minuta: "documento_minuta_path",
    };

    const updateField = map[document_type];

    if (!updateField) {
      return NextResponse.json(
        { error: "document_type inválido" },
        { status: 400 }
      );
    }

    // Payload dinâmico
    const payload = {
      [updateField]: filename,
      updated_at: new Date(),
    };

    // Regras opcionais por tipo
    if (document_type === "minuta") {
      payload.status = "minuta_gerada";
      payload.documento_minuta_url = null;
    }

    if (document_type === "assinado") {
      payload.status = "assinado";
      payload.documento_assinado_url = null;
    }

    const { data: uData, error: uErr } = await supabase
      .from("contratos")
      .update(payload)
      .eq("id", contrato_id)
      .select()
      .single();

    if (uErr) {
      console.error("ERRO UPDATE CONTRATO:", uErr);
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    console.log("UPDATE OK:", uData);

    return NextResponse.json({
      message: "Arquivo enviado com sucesso!",
      path: filename,
      signedUrl: signedUrlData.signedUrl, // retorna URL temporária para download imediato
      type: document_type,
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
