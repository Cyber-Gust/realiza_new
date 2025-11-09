import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 🔹 GET /api/crm/relatorios
 * KPIs e estatísticas do módulo CRM:
 * - Total de leads, propostas e visitas
 * - Taxa de conversão
 * - Tempo médio de conversão
 * - Funil de leads (por status)
 * - Propostas por status
 * - Leads por origem
 * - Ranking de corretores (somente propostas fechadas)
 */
export async function GET() {
  const supabase = createServiceClient();

  try {
    // =========================================================
    // 1️⃣ Busca dados básicos (leads, propostas, eventos)
    // =========================================================
    const [leadsRes, propostasRes, eventosRes] = await Promise.all([
      supabase
        .from("leads")
        .select("id, status, origem, corretor_id, created_at"),
      supabase
        .from("propostas")
        .select(
          "id, lead_id, corretor_id, status, valor_proposta, created_at"
        ),
      supabase
        .from("agenda_eventos")
        .select("id, tipo, data_inicio")
        .ilike("tipo", "%visita%")
    ]);

    if (leadsRes.error) throw leadsRes.error;
    if (propostasRes.error) throw propostasRes.error;
    if (eventosRes.error) throw eventosRes.error;

    const leads = leadsRes.data || [];
    const propostas = propostasRes.data || [];
    const visitas = eventosRes.data || [];

    // =========================================================
    // 2️⃣ KPIs básicos
    // =========================================================
    const totalLeads = leads.length;
    const totalPropostas = propostas.length;
    const totalVisitas = visitas.length;

    const taxaConversao = totalLeads
      ? ((totalPropostas / totalLeads) * 100).toFixed(1)
      : 0;

    // =========================================================
    // 3️⃣ Funil de leads por status
    // =========================================================
    const funilLeads = leads.reduce((acc, lead) => {
      const key = lead.status || "indefinido";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // =========================================================
    // 4️⃣ Propostas por status
    // =========================================================
    const propostasStatus = propostas.reduce((acc, prop) => {
      const key = prop.status || "indefinido";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // =========================================================
    // 5️⃣ Leads por origem
    // =========================================================
    const origens = leads.reduce((acc, lead) => {
      const key = lead.origem || "indefinido";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // =========================================================
    // 6️⃣ Tempo médio entre lead e proposta
    // =========================================================
    let somaDias = 0;
    let count = 0;
    for (const prop of propostas) {
      const lead = leads.find((l) => l.id === prop.lead_id);
      if (lead) {
        const diffMs = new Date(prop.created_at) - new Date(lead.created_at);
        const diffDias = diffMs / (1000 * 60 * 60 * 24);
        somaDias += diffDias;
        count++;
      }
    }
    const tempoMedioConversao = count ? (somaDias / count).toFixed(1) : 0;

    // =========================================================
    // 7️⃣ Ranking de corretores (somente propostas fechadas)
    // =========================================================
    const propostasFechadas = propostas.filter((p) =>
      ["fechada", "aceita", "concluida"].includes(
        (p.status || "").toLowerCase()
      )
    );

    // Agrupa por corretor_id
    const rankingRaw = propostasFechadas.reduce((acc, prop) => {
      if (!prop.corretor_id) return acc;
      acc[prop.corretor_id] = (acc[prop.corretor_id] || 0) + 1;
      return acc;
    }, {});

    const topCorretoresIds = Object.keys(rankingRaw);
    let topCorretores = [];

    if (topCorretoresIds.length > 0) {
      const { data: perfis, error: perfisError } = await supabase
        .from("profiles")
        .select("id, nome_completo")
        .in("id", topCorretoresIds);

      if (perfisError) throw perfisError;

      const mapPerfis = Object.fromEntries(
        (perfis || []).map((p) => [p.id, p.nome_completo || "Sem nome"])
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
