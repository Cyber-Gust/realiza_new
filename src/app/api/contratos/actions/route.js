import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req) {
  const supabase = createServiceClient();
  const body = await req.json();

  const { action, contrato_id, variaveis } = body;

  if (!action || !contrato_id)
    return NextResponse.json(
      { error: "action e contrato_id são obrigatórios." },
      { status: 400 }
    );

  // ============================================================
  // CARREGA CONTRATO + TEMPLATE
  // ============================================================
  const { data: contrato, error: cErr } = await supabase
    .from("contratos")
    .select("*, contrato_templates(*)")
    .eq("id", contrato_id)
    .single();

  if (cErr || !contrato)
    return NextResponse.json(
      { error: "Contrato não encontrado." },
      { status: 404 }
    );

  // ============================================================
  // 1) GERAR MINUTA (PDF)
  // ============================================================
  if (action === "gerar_minuta") {
    console.log("🔥 GERANDO MINUTA PARA:", contrato_id);

    let conteudo = contrato.contrato_templates?.conteudo;
    const vars = contrato.variaveis_json || {};

    if (!conteudo) {
      return NextResponse.json(
        { error: "Template não encontrado." },
        { status: 400 }
      );
    }

    // Substitui variáveis do template
    for (const [k, v] of Object.entries(vars)) {
      conteudo = conteudo.replaceAll(`{{${k}}}`, String(v ?? ""));
    }

    // Gera PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 800;
    for (const line of conteudo.split("\n")) {
      page.drawText(line, { x: 40, y, size: 12, font });
      y -= 18;
    }

    const pdfBytes = await pdfDoc.save();

    const path = `contratos/${contrato.id}/minuta-${Date.now()}.pdf`;
    console.log("📄 salvando minuta em:", path);

    const { error: upErr } = await supabase.storage
      .from("documentos_contratos")
      .upload(path, pdfBytes, { contentType: "application/pdf" });

    if (upErr) {
      console.error("❌ ERRO UPLOAD:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // UPDATE AGORA É VERIFICADO
    const { data: updated, error: updateErr } = await supabase
      .from("contratos")
      .update({
        documento_minuta_path: path,
        documento_minuta_url: null,
        status: "em_elaboracao",
        updated_at: new Date(),
      })
      .eq("id", contrato_id)
      .select("id, documento_minuta_path, status")
      .single();

    console.log("📌 UPDATE RESULT:", updated, updateErr);

    if (updateErr) {
      console.error("❌ ERRO UPDATE CONTRATO:", updateErr);
      return NextResponse.json(
        { error: "Erro ao salvar minuta: " + updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Minuta gerada!",
      path: updated.documento_minuta_path,
    });
  }

  // ============================================================
  // 2) ENVIAR PARA ASSINATURA (ASSINATURA FAKE)
  // ============================================================
  if (action === "enviar_assinatura") {
    if (!contrato.documento_minuta_path)
      return NextResponse.json(
        { error: "Gere a minuta antes de enviar para assinatura." },
        { status: 400 }
      );

    // baixa arquivo original
    const { data: file, error: dlErr } = await supabase.storage
      .from("documentos_contratos")
      .download(contrato.documento_minuta_path);

    if (dlErr)
      return NextResponse.json(
        { error: "Erro ao baixar minuta." },
        { status: 500 }
      );

    const originalBytes = await file.arrayBuffer();

    // cria PDF assinado fake
    const pdfDoc = await PDFDocument.load(originalBytes);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const lastPage = pdfDoc.getPages().pop();
    lastPage.drawText("ASSINADO DIGITALMENTE (PLACEHOLDER)", {
      x: 40,
      y: 40,
      size: 14,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    const signedBytes = await pdfDoc.save();
    const signedPath = `contratos/${contrato.id}/assinado-${Date.now()}.pdf`;

    const { error: signedErr } = await supabase.storage
      .from("documentos_contratos")
      .upload(signedPath, signedBytes, {
        contentType: "application/pdf",
      });

    if (signedErr)
      return NextResponse.json(
        { error: "Erro ao salvar o contrato assinado." },
        { status: 500 }
      );

    await supabase
      .from("contratos")
      .update({
        assinatura_status: "assinado",
        assinatura_concluida_em: new Date(),
        assinatura_url: null,
        documento_assinado_path: signedPath,
        documento_assinado_url: null,
        status: "assinado",
        updated_at: new Date(),
      })
      .eq("id", contrato_id);

    return NextResponse.json({
      message: "Assinatura simulada com sucesso!",
      path: signedPath,
    });
  }

  // ============================================================
  // 3) CRIAR ADITIVO
  // ============================================================
  if (action === "criar_aditivo") {
    const { data, error } = await supabase
      .from("contrato_aditivos")
      .insert({
        contrato_id,
        tipo: "aditivo",
        variaveis_json: variaveis || {},
        created_at: new Date(),
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      message: "Aditivo criado!",
      aditivo: data,
    });
  }

  // ============================================================
  // 4) REAJUSTE
  // ============================================================
  if (action === "reajustar") {
    const fator =
      contrato.indice_reajuste === "IGPM"
        ? 1.07
        : 1.05;

    const novoValor = Number(contrato.valor_acordado) * fator;

    await supabase
      .from("contratos")
      .update({
        valor_reajustado: novoValor.toFixed(2),
        ultimo_reajuste_em: new Date(),
        status: "vigente",
        updated_at: new Date(),
      })
      .eq("id", contrato_id);

    return NextResponse.json({
      message: "Reajuste aplicado!",
      novo_valor: novoValor,
    });
  }

  // ============================================================
  // 5) RENOVAR
  // ============================================================
  if (action === "renovar") {
    const hoje = new Date().toISOString().split("T")[0];

    await supabase
      .from("contratos")
      .update({
        renovado_em: hoje,
        data_inicio: hoje,
        status: "vigente",
        updated_at: new Date(),
      })
      .eq("id", contrato_id);

    return NextResponse.json({ message: "Contrato renovado!" });
  }

  // ============================================================
  // 6) ENCERRAR
  // ============================================================
  if (action === "encerrar") {
    await supabase
      .from("contratos")
      .update({
        status: "encerrado",
        rescisao_efetivada_em: new Date(),
        updated_at: new Date(),
      })
      .eq("id", contrato_id);

    return NextResponse.json({ message: "Contrato encerrado." });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
