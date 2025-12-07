import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createServiceClient();
  const body = await req.json();

  const { action, contrato_id } = body;

  if (!action || !contrato_id) {
    return NextResponse.json(
      { error: "action e contrato_id são obrigatórios" },
      { status: 400 }
    );
  }

  // ============================================================
  // Carrega contrato com template
  // ============================================================
  const { data: contrato, error: loadErr } = await supabase
    .from("contratos")
    .select("*, contrato_templates(*)")
    .eq("id", contrato_id)
    .single();

  if (loadErr || !contrato) {
    return NextResponse.json(
      { error: "Contrato não encontrado" },
      { status: 404 }
    );
  }

  // ============================================================
  // 1) GERAR MINUTA
  // ============================================================
  if (action === "gerar_minuta") {
    let conteudo = contrato.contrato_templates?.conteudo;
    const vars = contrato.variaveis_json || {};

    if (!conteudo) {
        return NextResponse.json(
        { error: "Template não encontrado no contrato" },
        { status: 400 }
        );
    }

    Object.entries(vars).forEach(([k, v]) => {
        conteudo = conteudo.replaceAll(`{{${k}}}`, v);
    });

    const filePath = `minutas/${contrato.id}-${Date.now()}.txt`;

    // Upload no bucket privado
    const { error: upErr } = await supabase.storage
        .from("documentos_contratos")
        .upload(filePath, conteudo, {
        contentType: "text/plain",
        });

    if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // Atualiza NO BANCO APENAS O PATH
    await supabase
        .from("contratos")
        .update({
        documento_minuta_path: filePath,
        updated_at: new Date().toISOString(),
        })
        .eq("id", contrato_id);

    return NextResponse.json({
        message: "Minuta gerada!",
        path: filePath,
    });
    }

  // ============================================================
  // 2) ENVIAR PARA ASSINATURA DIGITAL
  // ============================================================
  if (action === "enviar_assinatura") {
    const assinaturaId = `sign_${Date.now()}`;
    const assinaturaUrl = `https://assinador.fake/${assinaturaId}`;

    await supabase
      .from("contratos")
      .update({
        assinatura_id: assinaturaId,
        assinatura_status: "aguardando_assinatura",
        assinatura_url: assinaturaUrl,
        assinatura_enviado_em: new Date().toISOString(),
        status: "aguardando_assinatura",
      })
      .eq("id", contrato_id);

    return NextResponse.json({
      message: "Contrato enviado para assinatura!",
      assinatura_url: assinaturaUrl,
    });
  }

  // ============================================================
  // 3) CRIAR ADITIVO
  // ============================================================
  if (action === "criar_aditivo") {
    const { variaveis = {} } = body;

    const { data: aditivo, error: adErr } = await supabase
      .from("contrato_aditivos")
      .insert({
        contrato_id,
        tipo: "aditivo",
        variaveis_json: variaveis,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (adErr) {
      return NextResponse.json({ error: adErr.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Aditivo criado!",
      aditivo,
    });
  }

  // ============================================================
  // 4) APLICAR REAJUSTE
  // ============================================================
  if (action === "reajustar") {
    const indice = contrato.indice_reajuste; // IGPM / IPCA
    const valorOriginal = Number(contrato.valor_acordado);

    // reajuste fictício p/ placeholder (depois você define regra real)
    const fator = indice === "IGPM" ? 1.07 : 1.05;
    const novoValor = parseFloat((valorOriginal * fator).toFixed(2));

    await supabase
      .from("contratos")
      .update({
        valor_reajustado: novoValor,
        ultimo_reajuste_em: new Date().toISOString(),
        status: "vigente",
        updated_at: new Date().toISOString(),
      })
      .eq("id", contrato_id);

    return NextResponse.json({
      message: "Reajuste aplicado!",
      novo_valor: novoValor,
    });
  }

  // ============================================================
  // 5) RENOVAR CONTRATO
  // ============================================================
  if (action === "renovar") {
    await supabase
      .from("contratos")
      .update({
        renovado_em: new Date().toISOString(),
        data_inicio: new Date().toISOString().split("T")[0],
        status: "vigente",
        updated_at: new Date().toISOString(),
      })
      .eq("id", contrato_id);

    return NextResponse.json({
      message: "Contrato renovado!",
    });
  }

  // ============================================================
  // 6) ENCERRAR CONTRATO
  // ============================================================
  if (action === "encerrar") {
    await supabase
      .from("contratos")
      .update({
        status: "encerrado",
        rescisao_efetivada_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contrato_id);

    return NextResponse.json({
      message: "Contrato encerrado!",
    });
  }

  return NextResponse.json(
    { error: "Ação não reconhecida." },
    { status: 400 }
  );
}
