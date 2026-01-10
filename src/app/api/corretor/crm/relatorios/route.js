import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ============================================================
   📌 GET /api/crm/relatorios
   ——— Versão Avançada
   Filtros inteligentes + KPIs expandidos + Contratos
============================================================ */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  /* ============================================================
     📍 Coleta de filtros da URL
  ============================================================ */
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const corretor_id = searchParams.get("corretor_id");
  const origem = searchParams.get("origem");

  const status_lead = searchParams.get("status_lead");
  const interesse_tipo = searchParams.get("interesse_tipo");
  const interesse_disponibilidade = searchParams.get("interesse_disponibilidade");
  const cidade = searchParams.get("cidade");

  const status_proposta = searchParams.get("status_proposta");

  const imovel_status = searchParams.get("imovel_status");

  try {
    /* ============================================================
       🔧 Helper para aplicar filtro de data
    ============================================================ */
    const filterByDate = (query, field) => {
      if (inicio) query = query.gte(field, inicio);
      if (fim) query = query.lte(field, fim);
      return query;
    };

    /* ============================================================
       📌 1. LEADS
    ============================================================ */
    let leadsQuery = supabase.from("leads").select("*");

    leadsQuery = filterByDate(leadsQuery, "created_at");

    if (corretor_id) leadsQuery.eq("corretor_id", corretor_id);
    if (origem) leadsQuery.eq("origem", origem);
    if (status_lead) leadsQuery.eq("status", status_lead);
    if (interesse_tipo) leadsQuery.eq("interesse_tipo", interesse_tipo);
    if (interesse_disponibilidade)
      leadsQuery.eq("interesse_disponibilidade", interesse_disponibilidade);
    if (cidade) leadsQuery.ilike("cidade_preferida", `%${cidade}%`);

    const { data: leads, error: leadsErr } = await leadsQuery;
    if (leadsErr) throw leadsErr;

    /* ============================================================
       📌 2. PROPOSTAS
    ============================================================ */
    let propostasQuery = supabase.from("propostas").select("*");

    propostasQuery = filterByDate(propostasQuery, "created_at");

    if (corretor_id) propostasQuery.eq("corretor_id", corretor_id);
    if (status_proposta) propostasQuery.eq("status", status_proposta);

    const { data: propostas, error: propErr } = await propostasQuery;
    if (propErr) throw propErr;

    /* ============================================================
       📌 3. VISITAS
    ============================================================ */
    let visitasQuery = supabase
      .from("agenda_eventos")
      .select("*")
      .ilike("tipo", "%visita%");

    visitasQuery = filterByDate(visitasQuery, "data_inicio");

    if (corretor_id) visitasQuery.eq("profile_id", corretor_id);

    const { data: visitas, error: visitasErr } = await visitasQuery;
    if (visitasErr) throw visitasErr;

    /* ============================================================
       📌 4. CONTRATOS (NOVO!)
    ============================================================ */
    let contratosQuery = supabase.from("contratos").select("*");

    contratosQuery = filterByDate(contratosQuery, "created_at");

    if (corretor_id) {
      // contratos → imóvel → corretor
      contratosQuery = contratosQuery.eq("corretor_id", corretor_id);
    }

    if (imovel_status) {
      // join indireto, mas Supabase permite filter via subquery
      contratosQuery = contratosQuery.contains("imoveis.status", imovel_status);
    }

    const { data: contratos, error: contratosErr } = await contratosQuery;
    if (contratosErr) {
      // caso o contains falhe, ignora o filtro
      console.warn("⚠️ Falha ao filtrar contratos por imóvel. Seguindo sem filtro.");
    }

    /* ============================================================
       📊 FUNIL DE LEADS
    ============================================================ */
    const funilLeads = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    /* ============================================================
       🥧 STATUS DAS PROPOSTAS
    ============================================================ */
    const propostasStatus = propostas.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    /* ============================================================
       📍 ORIGENS
    ============================================================ */
    const origens = leads.reduce((acc, l) => {
      if (!l.origem) return acc;
      const key = l.origem.trim();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    /* ============================================================
       ⭐ RANKING CORRETORES
    ============================================================ */
    const ranking = {};
    leads.forEach((l) => {
      if (!l.corretor_id) return;
      ranking[l.corretor_id] = (ranking[l.corretor_id] || 0) + 1;
    });

    let topCorretores = [];
    const ids = Object.keys(ranking);

    if (ids.length > 0) {
      const { data: perfis } = await supabase
        .from("profiles")
        .select("id, nome_completo")
        .in("id", ids);

      topCorretores = perfis
        .map((p) => ({
          corretor_id: p.id,
          nome: p.nome_completo,
          total: ranking[p.id] || 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    }

    /* ============================================================
       📈 TAXA DE CONVERSÃO LEAD → PROPOSTA
    ============================================================ */
    const totalLeads = leads.length;
    const totalPropostas = propostas.length;

    const taxaConversao =
      totalLeads > 0
        ? Number(((totalPropostas / totalLeads) * 100).toFixed(1))
        : 0;

    /* ============================================================
       🔥 NOVO: Ticket Médio das Propostas
    ============================================================ */
    const ticketMedioPropostas =
      propostas.length > 0
        ? Number(
            (
              propostas.reduce((s, p) => s + Number(p.valor_proposta), 0) /
              propostas.length
            ).toFixed(2)
          )
        : 0;

    /* ============================================================
       🔥 NOVO: Conversão Final (Lead → Contrato)
    ============================================================ */
    const totalContratos = contratos?.length || 0;

    const conversaoFinal =
      totalLeads > 0
        ? Number(((totalContratos / totalLeads) * 100).toFixed(1))
        : 0;

    /* ============================================================
       ⏱️ TEMPO MÉDIO LEAD → PROPOSTA
    ============================================================ */
    let somaDias = 0;
    let count = 0;

    propostas.forEach((p) => {
      const lead = leads.find((l) => l.id === p.lead_id);
      if (!lead) return;

      const diff =
        (new Date(p.created_at) - new Date(lead.created_at)) /
        (1000 * 60 * 60 * 24);

      if (diff >= 0) {
        somaDias += diff;
        count++;
      }
    });

    const tempoMedioConversao = count > 0 ? Math.round(somaDias / count) : 0;

    /* ============================================================
       🔥 NOVO: FUNIL COMPLETO (Lead → Visita → Proposta → Contrato)
    ============================================================ */
    const funilCompleto = {
      leads: totalLeads,
      visitas: visitas.length,
      propostas: totalPropostas,
      contratos: totalContratos,
    };

    /* ============================================================
       🚀 RESPOSTA
    ============================================================ */
    return NextResponse.json({
      data: {
        totalLeads,
        totalPropostas,
        totalVisitas: visitas.length,
        totalContratos,

        taxaConversao,
        conversaoFinal,

        ticketMedioPropostas,
        tempoMedioConversao,

        funilLeads,
        funilCompleto,

        propostasStatus,
        origens,
        topCorretores,
      },
    });
  } catch (err) {
    console.error("❌ GET /crm/relatorios:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
