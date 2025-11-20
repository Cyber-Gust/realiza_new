import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ============================================================
   📌 GET /api/crm/relatorios
   Consolida KPIs, funil, visitas, propostas, origens e ranking.
   ============================================================ */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const corretor_id = searchParams.get("corretor_id");
  const origem = searchParams.get("origem");

  try {
    /* ============================================================
       🔎 HELPERS DE FILTRO
    ============================================================ */
    const filterByDate = (query, field) => {
      if (inicio) query = query.gte(field, inicio);
      if (fim) query = query.lte(field, fim);
      return query;
    };

    /* ============================================================
       📌 1. LEADS
    ============================================================ */
    let leadsQuery = supabase.from("leads").select("*", { count: "exact" });

    leadsQuery = filterByDate(leadsQuery, "created_at");
    if (corretor_id) leadsQuery = leadsQuery.eq("corretor_id", corretor_id);
    if (origem) leadsQuery = leadsQuery.eq("origem", origem);

    const { data: leads, error: leadsErr } = await leadsQuery;
    if (leadsErr) throw leadsErr;

    /* ============================================================
       📌 2. PROPOSTAS
    ============================================================ */
    let propostasQuery = supabase.from("propostas").select("*");

    propostasQuery = filterByDate(propostasQuery, "created_at");
    if (corretor_id) propostasQuery = propostasQuery.eq("corretor_id", corretor_id);

    const { data: propostas, error: propErr } = await propostasQuery;
    if (propErr) throw propErr;

    /* ============================================================
       📌 3. VISITAS (agenda_eventos)
    ============================================================ */
    let visitasQuery = supabase
      .from("agenda_eventos")
      .select("*")
      .ilike("tipo", "%visita%");

    visitasQuery = filterByDate(visitasQuery, "data_inicio");
    if (corretor_id) visitasQuery = visitasQuery.eq("profile_id", corretor_id);

    const { data: visitas, error: visitasErr } = await visitasQuery;
    if (visitasErr) throw visitasErr;

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
       📍 ORIGENS (contagem)
    ============================================================ */
    const origens = leads.reduce((acc, l) => {
      if (!l.origem) return acc;
      const key = l.origem.trim();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    /* ============================================================
       ⭐ TOP CORRETORES (por número de leads)
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
       📈 TAXA DE CONVERSÃO
    ============================================================ */
    const totalLeads = leads.length;
    const totalPropostas = propostas.length;

    const taxaConversao =
      totalLeads > 0
        ? Number(((totalPropostas / totalLeads) * 100).toFixed(1))
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
       🚀 RESPOSTA FINAL
    ============================================================ */
    return NextResponse.json({
      data: {
        totalLeads,
        totalPropostas,
        totalVisitas: visitas.length,
        taxaConversao,
        tempoMedioConversao,
        funilLeads,
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
