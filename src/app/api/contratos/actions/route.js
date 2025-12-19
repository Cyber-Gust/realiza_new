import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/* ======================================================
   STATUS — FONTE DA VERDADE
====================================================== */

const VALID_STATUSES = [
  "em_elaboracao",
  "aguardando_assinatura",
  "assinado",
  "vigente",
  "encerrado",
];

/**
 * Apenas ações que MUDAM status seguem fluxo.
 * Encerrar é override administrativo.
 */
const STATUS_FLOW = {
  gerar_minuta: {
    from: ["em_elaboracao"],
    to: "aguardando_assinatura",
  },
  enviar_assinatura: {
    from: ["aguardando_assinatura"],
    to: "assinado",
  },
};

function getNextStatus(action, currentStatus) {
  if (!VALID_STATUSES.includes(currentStatus)) {
    throw new Error(`Status '${currentStatus}' não reconhecido`);
  }

  const rule = STATUS_FLOW[action];
  if (!rule) {
    throw new Error(`Ação '${action}' não reconhecida`);
  }

  if (!rule.from.includes(currentStatus)) {
    throw new Error(
      `Ação '${action}' não permitida quando status é '${currentStatus}'`
    );
  }

  return rule.to;
}

/* ======================================================
   HANDLER
====================================================== */
export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const { action, contrato_id } = await req.json();

    if (!action || !contrato_id) {
      return NextResponse.json(
        { error: "action e contrato_id são obrigatórios." },
        { status: 400 }
      );
    }

    /* ====================================================
       CARREGA CONTRATO
    ==================================================== */
    const { data: contrato, error } = await supabase
      .from("contratos")
      .select("*, contrato_templates(*)")
      .eq("id", contrato_id)
      .single();

    if (error || !contrato) {
      return NextResponse.json(
        { error: "Contrato não encontrado." },
        { status: 404 }
      );
    }

    /* ====================================================
       1) GERAR MINUTA (apenas 1x)
    ==================================================== */
    if (action === "gerar_minuta") {
      if (contrato.documento_minuta_path) {
        return NextResponse.json(
          { error: "Minuta já foi gerada para este contrato." },
          { status: 400 }
        );
      }

      let conteudo = contrato.contrato_templates?.conteudo;
      const vars = contrato.variaveis_json || {};

      if (!conteudo) {
        return NextResponse.json(
          { error: "Template não encontrado." },
          { status: 400 }
        );
      }

      for (const [k, v] of Object.entries(vars)) {
        conteudo = conteudo.replaceAll(`{{${k}}}`, String(v ?? ""));
      }

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);

      const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

      page.drawText("CONTRATO", {
        x: 40,
        y: 800,
        size: 18,
        font: titleFont,
      });

      page.drawLine({
        start: { x: 40, y: 790 },
        end: { x: 555, y: 790 },
        thickness: 1,
      });

      page.drawText(conteudo, {
        x: 40,
        y: 760,
        size: 11,
        font: bodyFont,
        maxWidth: 515,
        lineHeight: 16,
      });

      page.drawText(
        "Documento gerado eletronicamente • Não requer assinatura física",
        {
          x: 40,
          y: 30,
          size: 9,
          font: bodyFont,
          color: rgb(0.4, 0.4, 0.4),
        }
      );

      const pdfBytes = await pdfDoc.save();
      const path = `contratos/${contrato.id}/minuta.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("documentos_contratos")
        .upload(path, pdfBytes, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: uploadError.message },
          { status: 500 }
        );
      }

      await supabase
        .from("contratos")
        .update({
          documento_minuta_path: path,
          status: getNextStatus("gerar_minuta", contrato.status),
          updated_at: new Date().toISOString(),
        })
        .eq("id", contrato_id);

      return NextResponse.json({
        message: "Minuta gerada com sucesso!",
        path,
      });
    }

    /* ====================================================
       2) ENVIAR PARA ASSINATURA (apenas 1x)
    ==================================================== */
    if (action === "enviar_assinatura") {
      if (contrato.documento_assinado_path) {
        return NextResponse.json(
          { error: "Contrato já foi assinado." },
          { status: 400 }
        );
      }

      if (!contrato.documento_minuta_path) {
        return NextResponse.json(
          { error: "Gere a minuta antes de enviar para assinatura." },
          { status: 400 }
        );
      }

      const { data: file, error: downloadErr } = await supabase.storage
        .from("documentos_contratos")
        .download(contrato.documento_minuta_path);

      if (downloadErr || !file) {
        return NextResponse.json(
          { error: "Erro ao carregar a minuta." },
          { status: 500 }
        );
      }

      const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const lastPage = pdfDoc.getPages().at(-1);
      lastPage.drawText("ASSINADO DIGITALMENTE", {
        x: 40,
        y: 40,
        size: 14,
        font,
      });

      const signedBytes = await pdfDoc.save();
      const signedPath = `contratos/${contrato.id}/assinado.pdf`;

      const { error: uploadSignedErr } = await supabase.storage
        .from("documentos_contratos")
        .upload(signedPath, signedBytes, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadSignedErr) {
        return NextResponse.json(
          { error: uploadSignedErr.message },
          { status: 500 }
        );
      }

      await supabase
        .from("contratos")
        .update({
          documento_assinado_path: signedPath,
          assinatura_status: "assinado",
          assinatura_concluida_em: new Date().toISOString(),
          status: getNextStatus("enviar_assinatura", contrato.status),
          updated_at: new Date().toISOString(),
        })
        .eq("id", contrato_id);

      return NextResponse.json({
        message: "Contrato assinado com sucesso!",
        path: signedPath,
      });
    }

    /* ====================================================
       3) ENCERRAR CONTRATO (override)
    ==================================================== */
    if (action === "encerrar") {
      if (contrato.status === "encerrado") {
        return NextResponse.json(
          { error: "Contrato já está encerrado." },
          { status: 400 }
        );
      }

      await supabase
        .from("contratos")
        .update({
          status: "encerrado",
          rescisao_efetivada_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", contrato_id);

      return NextResponse.json({
        message: "Contrato encerrado com sucesso.",
      });
    }

    return NextResponse.json(
      { error: "Ação inválida." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Erro em /api/contratos/actions:", err);

    return NextResponse.json(
      {
        error: err.message || "Erro interno inesperado",
      },
      { status: 400 }
    );
  }
}
