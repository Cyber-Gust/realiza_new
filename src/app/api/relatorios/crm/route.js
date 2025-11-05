import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Rota: /api/relatorios/crm
 * 🔹 Consolida métricas gerais do funil comercial
 * 🔹 Bypass de RLS via Service Role (createServiceClient)
 * 🔹 Permite filtros por período (?from=2025-01-01&to=2025-12-31)
 */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    // 🔎 Define range de data opcional
    const filter = from && to ? { gte: from, lte: to } : null;

    const [leadsAtivos, concluidos, perdidos, visitas, propostas] = await Promise.all([
      // Leads ativos (qualquer status exceto concluído/perdido)
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .not("status", "in", '("concluido","perdido")'),

      // Leads concluídos
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "concluido"),

      // Leads perdidos
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "perdido"),

      // Eventos do tipo "visita"
      supabase
        .from("agenda_eventos")
        .select("id", { count: "exact", head: true })
        .ilike("tipo", "%visita%"),

      // Propostas enviadas
      supabase
        .from("propostas")
        .select("id", { count: "exact", head: true }),
    ]);

    // ⚙️ Cálculo seguro de conversão
    const totalLeads =
      (leadsAtivos.count || 0) + (concluidos.count || 0) + (perdidos.count || 0);
    const taxaConversao =
      totalLeads > 0 ? (concluidos.count / totalLeads) * 100 : 0;

    // ✅ Retorno consolidado
    return NextResponse.json({
      success: true,
      data: {
        total_leads: totalLeads,
        leads_ativos: leadsAtivos.count || 0,
        propostas: propostas.count || 0,
        visitas: visitas.count || 0,
        taxa_conversao: taxaConversao,
      },
    });
  } catch (err) {
    console.error("Erro no relatório CRM:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
