import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 💰 API Financeiro — CRUD completo
 *
 * Funcionalidades:
 *  - GET: Listagem + filtros
 *  - POST: Criação de lançamento financeiro
 *  - PUT: Atualização de status/dados
 *  - DELETE: Exclusão de transação
 *
 * Query params suportados no GET:
 *   ?type=receber|pagar|repasse|inadimplencia|comissoes|fluxo
 *   ?status=pago|pendente|atrasado|cancelado
 *   ?contrato_id=<uuid>
 *   ?profile_id=<uuid>
 *   ?imovel_id=<uuid>
 *   ?start_date=YYYY-MM-DD
 *   ?end_date=YYYY-MM-DD
 */

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type") || "lancamentos";
  const status = searchParams.get("status");
  const contrato_id = searchParams.get("contrato_id");
  const profile_id = searchParams.get("profile_id");
  const imovel_id = searchParams.get("imovel_id");
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");

  try {
    let query = supabase
      .from("transacoes")
      .select(
        `
        id,
        contrato_id,
        imovel_id,
        profile_id,
        tipo,
        status,
        descricao,
        valor,
        data_vencimento,
        data_pagamento,
        dados_cobranca_json,
        created_at
      `,
        { count: "exact" }
      );

    // ========================
    // 🔹 Filtros dinâmicos
    // ========================
    if (status && status !== "all") query = query.eq("status", status);
    if (contrato_id) query = query.eq("contrato_id", contrato_id);
    if (profile_id) query = query.eq("profile_id", profile_id);
    if (imovel_id) query = query.eq("imovel_id", imovel_id);
    if (start_date) query = query.gte("data_vencimento", start_date);
    if (end_date) query = query.lte("data_vencimento", end_date);

    // ========================
    // 🔸 Tipos lógicos
    // ========================
    switch (type) {
      case "receber":
        query = query.in("tipo", [
          "receita_aluguel",
          "taxa_adm_imobiliaria",
        ]);
        break;

      case "pagar":
        query = query.in("tipo", [
          "repasse_proprietario",
          "comissao_corretor",
          "despesa_manutencao",
          "pagamento_iptu",
          "pagamento_condominio",
        ]);
        break;

      case "repasse":
        query = query.eq("tipo", "repasse_proprietario");
        break;

      case "comissoes":
        query = query.eq("tipo", "comissao_corretor");
        break;

      case "inadimplencia":
        query = query.in("status", ["pendente", "atrasado"]);
        break;

      case "lancamentos":
      case "fluxo":
      default:
        // NÃO filtra nada
        break;
    }

    query = query.order("data_vencimento", { ascending: false });
    const { data, error, count } = await query;
    if (error) throw error;

    // ========================
    // 🔹 Enriquecimento básico
    // ========================
    const contratosIds = [...new Set(data.map((d) => d.contrato_id).filter(Boolean))];
    const imoveisIds = [...new Set(data.map((d) => d.imovel_id).filter(Boolean))];
    const perfisIds = [...new Set(data.map((d) => d.profile_id).filter(Boolean))];

    const [contratosRes, imoveisRes, perfisRes] = await Promise.all([
      contratosIds.length
        ? supabase
            .from("contratos")
            .select("id, tipo, data_inicio, data_fim, valor_acordado, proprietario_id, inquilino_id")
            .in("id", contratosIds)
        : { data: [] },
      imoveisIds.length
        ? supabase
            .from("imoveis")
            .select("id, titulo, endereco_cidade, endereco_estado")
            .in("id", imoveisIds)
        : { data: [] },
      perfisIds.length
        ? supabase.from("profiles").select("id, nome_completo, role").in("id", perfisIds)
        : { data: [] },
    ]);

    const contratosMap = Object.fromEntries((contratosRes.data || []).map((c) => [c.id, c]));
    const imoveisMap = Object.fromEntries((imoveisRes.data || []).map((i) => [i.id, i]));
    const perfisMap = Object.fromEntries((perfisRes.data || []).map((p) => [p.id, p]));

    const enriched = data.map((t) => ({
      ...t,
      contrato: contratosMap[t.contrato_id] || null,
      imovel: imoveisMap[t.imovel_id] || null,
      profile: perfisMap[t.profile_id] || null,
    }));

    // ========================
    // 💵 Agregados financeiros
    // ========================
    const total_pago = enriched
      .filter((t) => t.status === "pago")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const total_pendente = enriched
      .filter((t) => ["pendente", "atrasado"].includes(t.status))
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);

    return NextResponse.json({
      data: enriched,
      meta: {
        total_registros: count || enriched.length,
        total_pago,
        total_pendente,
        filtro: type,
      },
    });
  } catch (err) {
    console.error("❌ Erro em /api/financeiro [GET]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * 🔹 Criação de nova transação financeira
 */
export async function POST(req) {
  const supabase = createServiceClient();
  try {
    const body = await req.json();
    const {
      contrato_id,
      imovel_id,
      profile_id,
      tipo,
      status = "pendente",
      descricao,
      valor,
      data_vencimento,
      data_pagamento,
      dados_cobranca_json = {},
    } = body;

    if (!tipo || !valor) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const { data, error } = await supabase.from("transacoes").insert([
      {
        contrato_id,
        imovel_id,
        profile_id,
        tipo,
        status,
        descricao,
        valor,
        data_vencimento,
        data_pagamento,
        dados_cobranca_json,
      },
    ]);

    if (error) throw error;
    return NextResponse.json({ message: "Transação criada com sucesso.", data });
  } catch (err) {
    console.error("❌ Erro em /api/financeiro [POST]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * 🔹 Atualização de transação
 * Suporta update de status, valor, datas, descrição etc.
 */
export async function PUT(req) {
  const supabase = createServiceClient();
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from("transacoes").update(updates).eq("id", id).select();
    if (error) throw error;

    return NextResponse.json({ message: "Transação atualizada com sucesso.", data });
  } catch (err) {
    console.error("❌ Erro em /api/financeiro [PUT]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * 🔹 Exclusão de transação
 */
export async function DELETE(req) {
  const supabase = createServiceClient();
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "ID obrigatório para exclusão." }, { status: 400 });

    const { error } = await supabase.from("transacoes").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ message: "Transação removida com sucesso." });
  } catch (err) {
    console.error("❌ Erro em /api/financeiro [DELETE]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
