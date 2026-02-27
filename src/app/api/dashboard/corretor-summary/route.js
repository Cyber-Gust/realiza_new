import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/* ======================================================
   HELPERS
====================================================== */

function getDateRange(periodo) {
  const now = new Date();
  const start = new Date(now);

  const ranges = {
    "7d": () => start.setDate(start.getDate() - 7),
    "30d": () => start.setDate(start.getDate() - 30),
    "90d": () => start.setDate(start.getDate() - 90),
    "12m": () => start.setFullYear(start.getFullYear() - 1),
  };

  (ranges[periodo] || ranges["30d"])();

  return { start, end: now };
}

function validate(res, label) {
  if (!res || res.error) {
    console.error("❌ Supabase:", label, res?.error);
    throw new Error(`Erro ao buscar ${label}`);
  }
  return res;
}

/* ======================================================
   ROUTE
====================================================== */

export async function GET(request) {
  try {
    const supabase = await createClient(); // usuário logado
    const supabaseAdmin = createServiceClient(); // bypass RLS

    // 🔐 Pega usuário logado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const corretorId = user.id;

    const params = request.nextUrl.searchParams;
    const periodo = params.get("periodo") || "30d";
    const { start, end } = getDateRange(periodo);

    /* ======================================================
       1) IMÓVEIS DO CORRETOR
    ====================================================== */

    const imoveis = validate(
      await supabaseAdmin
        .from("imoveis")
        .select("*", { count: "exact" })
        .eq("corretor_id", corretorId),
      "imoveis"
    );

    const imoveisDisponiveis = imoveis.data.filter(i => i.status === "disponivel").length;
    const imoveisVendidos = imoveis.data.filter(i => i.status === "vendido").length;
    const imoveisAlugados = imoveis.data.filter(i => i.status === "alugado").length;

    /* ======================================================
       2) LEADS DO CORRETOR
    ====================================================== */

    const leads = validate(
      await supabaseAdmin
        .from("leads")
        .select("*", { count: "exact" })
        .eq("corretor_id", corretorId),
      "leads"
    );

    const leadsAtivos = leads.data.filter(
      l => l.status !== "concluido" && l.status !== "perdido"
    ).length;

    /* ======================================================
       3) PROPOSTAS DO CORRETOR
    ====================================================== */

    const propostas = validate(
      await supabaseAdmin
        .from("propostas")
        .select("*", { count: "exact" })
        .eq("corretor_id", corretorId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString()),
      "propostas"
    );

    const propostasAprovadas = propostas.data.filter(p => p.status === "aceita").length;

    /* ======================================================
       4) COMISSÕES (FINANCEIRO)
    ====================================================== */

    const transacoes = validate(
      await supabaseAdmin
        .from("transacoes")
        .select("*")
        .eq("tipo", "comissao_corretor")
        .gte("data_vencimento", start.toISOString())
        .lte("data_vencimento", end.toISOString()),
      "transacoes"
    );

    let comissaoRecebida = 0;

    transacoes.data.forEach(t => {
      if (t.status === "pago") {
        comissaoRecebida += Number(t.valor || 0);
      }
    });

    /* ======================================================
       5) ÚLTIMOS LEADS
    ====================================================== */

    const recentsLeads = validate(
      await supabaseAdmin
        .from("leads")
        .select("*")
        .eq("corretor_id", corretorId)
        .order("created_at", { ascending: false })
        .limit(5),
      "recents leads"
    );

    /* ======================================================
       6) ÚLTIMOS IMÓVEIS
    ====================================================== */

    const recentsImoveis = validate(
      await supabaseAdmin
        .from("imoveis")
        .select("*")
        .eq("corretor_id", corretorId)
        .order("created_at", { ascending: false })
        .limit(5),
      "recents imoveis"
    );

    /* ======================================================
       RESPONSE
    ====================================================== */

    return NextResponse.json({
      imoveis: {
        total: imoveis.count || 0,
        disponiveis: imoveisDisponiveis,
        vendidos: imoveisVendidos,
        alugados: imoveisAlugados,
      },

      leads: {
        total: leads.count || 0,
        ativos: leadsAtivos,
      },

      propostas: {
        enviadas: propostas.count || 0,
        aprovadas: propostasAprovadas,
      },

      financeiro: {
        comissao_recebida: comissaoRecebida,
      },

      recents: {
        leads: recentsLeads.data || [],
        imoveis: recentsImoveis.data || [],
      }
    });

  } catch (error) {
    console.error("🔥 ERRO CORRETOR SUMMARY:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}