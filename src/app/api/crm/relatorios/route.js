import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 🔹 GET /api/crm/relatorios
 * KPIs do CRM com filtros:
 * - Data inicial / final
 * - Corretor
 * - Origem
 */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const corretor_id = searchParams.get("corretor_id");
  const origem = searchParams.get("origem");

  try {
    // =========================================================
    // 1️⃣ Leads filtrados
    // =========================================================
    let leadsQuery = supabase
      .from("leads")
      .select("id, status, origem, corretor_id, created_at");

    if (inicio) leadsQuery = leadsQuery.gte("created_at", inicio);
    if (fim) leadsQuery = leadsQuery.lte("created_at", fim);
    if (corretor_id) leadsQuery = leadsQuery.eq("corretor_id", corretor_id);
    if (origem) leadsQuery = leadsQuery.ilike("origem", `%${origem}%`);

    const leadsRes = await leadsQuery;
    if (leadsRes.error) throw leadsRes.error;
    const leads = leadsRes.data || [];

    // =========================================================
    // 2️⃣ Propostas filtradas
    // =========================================================
    let propostasQuery = supabase
      .from("propostas")
      .select("id, lead_id, corretor_id, status, valor_proposta, created_at");

    if (inicio) propostasQuery = propostasQuery.gte("created_at", inicio);
    if (fim) propostasQuery = propostasQuery.lte("created_at", fim);
    if (corretor_id) propostasQuery = propostasQuery.eq("corretor_id", corretor_id);

    const propostasRes = await propostasQuery;
    if (propostasRes.error) throw propostasRes.error;
    const propostas = propostasRes.data || [];

    // =========================================================
    // 3️⃣ Eventos filtrados (visitas)
    // =========================================================
    let eventosQuery = supabase
      .from("agenda_eventos")
      .select("id, tipo, data_inicio")
      .ilike("tipo", "%visita%");
    if (inicio) eventosQuery = eventosQuery.gte("data_inicio", inicio);
    if (fim) eventosQuery = eventosQuery.lte("data_inicio", fim);

    const eventosRes = await eventosQuery;
    if (eventosRes.error) throw eventosRes.error;
    const visitas = eventosRes.data || [];

    // =========================================================
    // 4️⃣ Cálculos dos KPIs
    // =========================================================
    const totalLeads = leads.length;
    const totalPropostas = propostas.length;
    const totalVisitas = visitas.length;

    const taxaConversao = totalLeads
      ? ((totalPropostas / totalLeads) * 100).toFixed(1)
      : 0;

    // Funil de leads
    const funilLeads = leads.reduce((acc, lead) => {
      const key = lead.status || "indefinido";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Propostas por status
    const propostasStatus = propostas.reduce((acc, prop) => {
      const key = prop.status || "indefinido";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Leads por origem
    const origens = leads.reduce((acc, lead) => {
      const key = lead.origem || "indefinido";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Tempo médio Lead → Proposta
    let somaDias = 0;
    let count = 0;
    for (const prop of propostas) {
      const lead = leads.find((l) => l.id === prop.lead_id);
      if (lead) {
        const diffMs = new Date(prop.created_at) - new Date(lead.created_at);
        somaDias += diffMs / (1000 * 60 * 60 * 24);
        count++;
      }
    }
    const tempoMedioConversao = count ? (somaDias / count).toFixed(1) : 0;

    // Ranking de corretores
    const propostasFechadas = propostas.filter((p) =>
      ["fechada", "aceita", "concluida"].includes(
        (p.status || "").toLowerCase()
      )
    );

    const rankingRaw = propostasFechadas.reduce((acc, prop) => {
      if (!prop.corretor_id) return acc;
      acc[prop.corretor_id] = (acc[prop.corretor_id] || 0) + 1;
      return acc;
    }, {});

    let topCorretores = [];
    const ids = Object.keys(rankingRaw);
    if (ids.length > 0) {
      const { data: perfis, error } = await supabase
        .from("profiles")
        .select("id, nome_completo")
        .in("id", ids);
      if (error) throw error;
      const mapPerfis = Object.fromEntries(
        (perfis || []).map((p) => [p.id, p.nome_completo])
      );
      topCorretores = Object.entries(rankingRaw)
        .map(([id, total]) => ({
          corretor_id: id,
          nome: mapPerfis[id] || "Desconhecido",
          total,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    }

    // =========================================================
    // ✅ Retorno consolidado
    // =========================================================
    return NextResponse.json({
      data: {
        totalLeads,
        totalPropostas,
        totalVisitas,
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
