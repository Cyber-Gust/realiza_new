import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* =====================================================================
    🔥 VALIDAÇÕES E ENUMS (baseados no schema real)
===================================================================== */

const ENUM_STATUS = ["disponivel", "reservado", "alugado", "vendido", "inativo"];
const ENUM_DISP = ["venda", "locacao", "ambos"];

/* =====================================================================
    🔥 HANDLERS DE AÇÃO
===================================================================== */

async function getImovel(supabase, id) {
  const { data, error } = await supabase
    .from("imoveis")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

async function getChaves(supabase, id) {
  const { data, error } = await supabase
    .from("imoveis")
    .select("chaves_localizacao")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

async function getChavesHistorico(supabase, id) {
  const { data, error } = await supabase
    .from("imoveis_chaves_historico")
    .select(`
      id,
      acao,
      localizacao,
      observacao,
      created_at,
      usuario_id,
      profiles:usuario_id (nome_completo)
    `)
    .eq("imovel_id", id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data;
}

async function getCompliance(supabase, id) {
  const { data, error } = await supabase
    .from("imoveis")
    .select("documentos_compliance_json")
    .eq("id", id)
    .single();

  if (error) throw error;

  const docs = Array.isArray(data?.documentos_compliance_json)
    ? data.documentos_compliance_json
    : [];

  const signedDocs = await Promise.all(
    docs.map(async (d) => {
      if (!d.path) return d;

      const { data: signed } = await supabase.storage
        .from("documentos_compliance")
        .createSignedUrl(d.path, 60 * 5);

      return { ...d, url: signed?.signedUrl };
    })
  );

  return signedDocs;
}

async function getPrecos(supabase, id) {
  const { data, error } = await supabase
    .from("imoveis_precos")
    .select("id, created_at, tipo, valor, descricao, usuario_id")
    .eq("imovel_id", id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

async function getFinanceiro(supabase, id) {
  // último contrato
  const { data: contratos } = await supabase
    .from("contratos")
    .select("id, data_fim, tipo, valor_acordado, status")
    .eq("imovel_id", id)
    .order("data_fim", { ascending: false })
    .limit(1);

  const ultimoContrato = contratos?.[0] || null;

  let diasVacancia = null;
  if (ultimoContrato?.data_fim) {
    const fim = new Date(ultimoContrato.data_fim);
    const hoje = new Date();
    const diff = Math.floor((hoje - fim) / (1000 * 60 * 60 * 24));
    diasVacancia = diff > 0 ? diff : 0;
  }

  // transações
  const { data: transacoes } = await supabase
    .from("transacoes")
    .select("tipo, valor, status, data_pagamento")
    .eq("imovel_id", id)
    .in("status", ["pago", "pendente"]);

  let receita = 0,
    despesa = 0,
    ultimoPagamento = null;

  transacoes?.forEach((tx) => {
    const v = Number(tx.valor);

    if (tx.status === "pago") {
      if (tx.tipo.startsWith("receita_")) receita += v;
      if (tx.tipo.startsWith("despesa_") || tx.tipo.startsWith("pagamento_"))
        despesa += v;

      if (!ultimoPagamento || new Date(tx.data_pagamento) > new Date(ultimoPagamento))
        ultimoPagamento = tx.data_pagamento;
    }
  });

  return {
    vacancia: {
      dias: diasVacancia,
      ultimo_contrato: ultimoContrato,
    },
    financeiro: {
      receita_total: receita,
      despesa_total: despesa,
      saldo: receita - despesa,
      ultimo_pagamento: ultimoPagamento,
    },
  };
}

/* =====================================================================
    🔥 METHOD: GET
===================================================================== */
export async function GET(req, context) {
  const params = await context.params;     // 👈 CORREÇÃO DEFINITIVA
  try {
    const id = params.id;

    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    switch (action) {
      case "chaves":
        return NextResponse.json({ data: await getChaves(supabase, id) });
      case "chaves_historico":
        return NextResponse.json({ data: await getChavesHistorico(supabase, id) });
      case "compliance":
        return NextResponse.json({ data: await getCompliance(supabase, id) });
      case "precos":
        return NextResponse.json({ data: await getPrecos(supabase, id) });
      case "financeiro":
        return NextResponse.json({ data: await getFinanceiro(supabase, id) });
      default:
        return NextResponse.json({ data: await getImovel(supabase, id) });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

/* =====================================================================
    🔥 METHOD: PUT
===================================================================== */
export async function PUT(req, context) {
  const params = await context.params;     // 👈 MESMO PATCH
  try {
    const id = params.id;
    if (!id) throw new Error("ID inválido.");

    const body = await req.json();
    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    /* ------------------ ATUALIZAR IMÓVEL ------------------ */
    if (!action) {
      const update = { ...body, updated_at: new Date().toISOString() };

      /* --- sanitize midias e imagem_principal --- */

      // imagem_principal deve ser string
      if (update.imagem_principal !== undefined && update.imagem_principal !== null) {
        update.imagem_principal = String(update.imagem_principal);
      }

      // midias deve ser array de strings SEMPRE
      if (update.midias !== undefined) {
        if (!Array.isArray(update.midias)) {
          throw new Error("Campo 'midias' deve ser um array de URLs.");
        }

        update.midias = update.midias.map((m) => String(m));
      }

      if (update.status && !ENUM_STATUS.includes(update.status))
        throw new Error("Status inválido.");

      if (update.disponibilidade && !ENUM_DISP.includes(update.disponibilidade))
        throw new Error("Disponibilidade inválida.");

      ["mobiliado", "pet_friendly", "piscina", "elevador", "area_gourmet"].forEach(f => {
        if (update[f] !== undefined) update[f] = !!update[f];
      });

      const { data, error } = await supabase
        .from("imoveis")
        .update(update)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data });
    }

    /* ------------------ CHAVES (LOCALIZAÇÃO) ------------------ */
    if (action === "chaves") {
      const { localizacao, acao, observacao, usuario_id } = body;

      await supabase
        .from("imoveis")
        .update({
          chaves_localizacao: localizacao,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      await supabase.from("imoveis_chaves_historico").insert({
        imovel_id: id,
        usuario_id: usuario_id || null,
        acao: acao || "outro",
        localizacao,
        observacao,
      });

      return NextResponse.json({ message: "Chaves atualizadas." });
    }

    /* ------------------ ADD PREÇO ------------------ */
    if (action === "precos_add") {
      const { tipo, valor, descricao, usuario_id } = body;

      const field = tipo === "locacao" ? "preco_locacao" : "preco_venda";

      await supabase.from("imoveis").update({ [field]: valor }).eq("id", id);

      await supabase.from("imoveis_precos").insert({
        imovel_id: id,
        tipo,
        valor,
        descricao,
        usuario_id,
      });

      return NextResponse.json({ message: "Preço atualizado." });
    }

    /* ------------------ ADD COMPLIANCE ------------------ */
    if (action === "compliance_add") {
      const { doc } = body;

      const { data: current } = await supabase
        .from("imoveis")
        .select("documentos_compliance_json")
        .eq("id", id)
        .single();

      const list = Array.isArray(current?.documentos_compliance_json)
        ? [...current.documentos_compliance_json, doc]
        : [doc];

      await supabase
        .from("imoveis")
        .update({ documentos_compliance_json: list })
        .eq("id", id);

      return NextResponse.json({ message: "Documento adicionado." });
    }

    /* ------------------ REMOVE COMPLIANCE ------------------ */
    if (action === "compliance_remove") {
      const { doc_id, path } = body;

      if (path) {
        await supabase.storage.from("documentos_compliance").remove([path]);
      }

      const { data: current } = await supabase
        .from("imoveis")
        .select("documentos_compliance_json")
        .eq("id", id)
        .single();

      const list = current.documentos_compliance_json.filter(
        (d) => d.id !== doc_id
      );

      await supabase
        .from("imoveis")
        .update({ documentos_compliance_json: list })
        .eq("id", id);

      return NextResponse.json({ message: "Documento removido." });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

/* =====================================================================
    🔥 METHOD: DELETE
===================================================================== */
export async function DELETE(req, context) {
  const params = await context.params;     // 👈 AQUI TAMBÉM
  try {
    const id = params.id;
    if (!id) throw new Error("ID inválido.");

    const supabase = createServiceClient();
    const body = await req.json();

    if (body.soft) {
      await supabase
        .from("imoveis")
        .update({ status: "inativo", updated_at: new Date().toISOString() })
        .eq("id", id);

      return NextResponse.json({ message: "Imóvel inativado." });
    }

    await supabase.from("imoveis").delete().eq("id", id);
    return NextResponse.json({ message: "Imóvel deletado." });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
