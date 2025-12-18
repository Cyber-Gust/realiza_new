import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/* ======================================================
   STATUS FLOW — FONTE DA VERDADE
====================================================== */

const VALID_STATUSES = [
  "em_elaboracao",
  "aguardando_assinatura",
  "assinado",
  "ativo",
  "vigente",
  "reajuste_pendente",
  "renovado",
  "encerrado",
];

const STATUS_FLOW = {
  gerar_minuta: {
    from: ["em_elaboracao"],
    to: "aguardando_assinatura",
  },
  enviar_assinatura: {
    from: ["aguardando_assinatura"],
    to: "assinado",
  },
  criar_aditivo: {
    from: ["vigente", "ativo"],
    to: "ativo",
  },
  reajustar: {
    from: ["vigente", "ativo"],
    to: "reajuste_pendente",
  },
  renovar: {
    from: ["vigente", "ativo"],
    to: "renovado",
  },
  encerrar: {
    from: ["vigente", "ativo", "renovado"],
    to: "encerrado",
  },
};

function getNextStatus(action, currentStatus) {
  if (!VALID_STATUSES.includes(currentStatus)) {
    throw new Error(
      `Status '${currentStatus}' não é reconhecido pelo sistema`
    );
  }

  const rule = STATUS_FLOW[action];
  if (!rule) {
    throw new Error(`Ação '${action}' não reconhecida`);
  }

  if (!rule.from.includes(currentStatus)) {
    throw new Error(
      `Ação '${action}' não permitida quando o contrato está '${currentStatus}'`
    );
  }

  return rule.to;
}

/* ======================================================
   HANDLER
====================================================== */
export async function POST(req) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();

    const { action, contrato_id, variaveis } = body;

    if (!action || !contrato_id) {
      return NextResponse.json(
        { error: "action e contrato_id são obrigatórios." },
        { status: 400 }
      );
    }

    // TODO: todo o código que você já tem fica aqui dentro
    // inclusive chamadas a getNextStatus()

  } catch (err) {
    console.error("Erro em /api/contratos/actions:", err);

    return NextResponse.json(
      {
        error: err.message || "Erro interno inesperado",
      },
      { status: 400 } // 👈 aqui é REGRA DE NEGÓCIO, não 500
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
     1) GERAR MINUTA
  ==================================================== */
  if (action === "gerar_minuta") {
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
    const path = `contratos/${contrato.id}/minuta-${Date.now()}.pdf`;

    const { error: upErr } = await supabase.storage
      .from("documentos_contratos")
      .upload(path, pdfBytes, { contentType: "application/pdf" });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
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
     2) ENVIAR PARA ASSINATURA
  ==================================================== */
  if (action === "enviar_assinatura") {
    if (!contrato.documento_minuta_path) {
      return NextResponse.json(
        { error: "Gere a minuta antes de enviar para assinatura." },
        { status: 400 }
      );
    }

    const { data: file } = await supabase.storage
      .from("documentos_contratos")
      .download(contrato.documento_minuta_path);

    const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const lastPage = pdfDoc.getPages().pop();
    lastPage.drawText("ASSINADO DIGITALMENTE", {
      x: 40,
      y: 40,
      size: 14,
      font,
    });

    const signedBytes = await pdfDoc.save();
    const signedPath = `contratos/${contrato.id}/assinado-${Date.now()}.pdf`;

    await supabase.storage
      .from("documentos_contratos")
      .upload(signedPath, signedBytes, {
        contentType: "application/pdf",
      });

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
     3) CRIAR ADITIVO
  ==================================================== */
  if (action === "criar_aditivo") {
    const { data } = await supabase
      .from("contrato_aditivos")
      .insert({
        contrato_id,
        tipo: "aditivo",
        variaveis_json: variaveis || {},
      })
      .select()
      .single();

    await supabase
      .from("contratos")
      .update({
        status: getNextStatus("criar_aditivo", contrato.status),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contrato_id);

    return NextResponse.json({
      message: "Aditivo criado com sucesso!",
      aditivo: data,
    });
  }

  /* ====================================================
     4) REAJUSTAR
  ==================================================== */
  if (action === "reajustar") {
    const fator = contrato.indice_reajuste === "IGPM" ? 1.07 : 1.05;
    const novoValor = Number(contrato.valor_acordado) * fator;

    await supabase
      .from("contratos")
      .update({
        valor_reajustado: novoValor.toFixed(2),
        ultimo_reajuste_em: new Date().toISOString(),
        status: getNextStatus("reajustar", contrato.status),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contrato_id);

    return NextResponse.json({
      message: "Reajuste aplicado!",
      novo_valor: novoValor,
    });
  }

  /* ====================================================
     5) RENOVAR
  ==================================================== */
  if (action === "renovar") {
    const hoje = new Date().toISOString().split("T")[0];

    await supabase
      .from("contratos")
      .update({
        data_inicio: hoje,
        renovado_em: hoje,
        status: getNextStatus("renovar", contrato.status),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contrato_id);

    return NextResponse.json({ message: "Contrato renovado!" });
  }

  /* ====================================================
     6) ENCERRAR
  ==================================================== */
  if (action === "encerrar") {
    await supabase
      .from("contratos")
      .update({
        status: getNextStatus("encerrar", contrato.status),
        rescisao_efetivada_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contrato_id);

    return NextResponse.json({ message: "Contrato encerrado." });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
