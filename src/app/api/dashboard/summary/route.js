// src/app/api/dashboard/summary/route.js

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ======================================================
   HELPERS
====================================================== */

function getDateRange(periodo) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  const ranges = {
    "7d": () => start.setDate(start.getDate() - 7),
    "30d": () => start.setDate(start.getDate() - 30),
    "90d": () => start.setDate(start.getDate() - 90),
    "12m": () => start.setFullYear(start.getFullYear() - 1),
  };

  (ranges[periodo] || ranges["30d"])();

  return { start, end };
}

function parseFilters(params) {
  return {
    periodo: params.get("periodo") || "30d",
    tipoImovel: params.get("tipo_imovel") || "all",
    leadStatus: params.get("lead_status") || "all",
  };
}

function validate(res, label) {
  if (res.error) {
    throw new Error(
      `Erro ao buscar ${label}: ${res.error.message || "erro desconhecido"}`
    );
  }
  return res;
}

async function fetchCount(supabase, table, column, value) {
  const res = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, value);

  validate(res, `${table}.${column}=${value}`);
  return res.count ?? 0;
}

/* ======================================================
   ROUTE HANDLER
====================================================== */

export async function GET(request) {
  const supabase = createServiceClient();
  const params = request.nextUrl.searchParams;

  const filters = parseFilters(params);
  const { start, end } = getDateRange(filters.periodo);

  try {
    /* ---------------------------------------------------------
       1) IMÓVEIS
    --------------------------------------------------------- */
    let imoveisQuery = supabase.from("imoveis").select("*", { count: "exact" });

    if (filters.tipoImovel !== "all") {
      imoveisQuery.eq("tipo", filters.tipoImovel);
    }

    const totalImoveis = validate(await imoveisQuery, "total de imóveis");

    const [alugados, vendidos, disponiveis] = await Promise.all([
      fetchCount(supabase, "imoveis", "status", "alugado"),
      fetchCount(supabase, "imoveis", "status", "vendido"),
      fetchCount(supabase, "imoveis", "status", "disponivel"),
    ]);

    const taxa_ocupacao = totalImoveis.count
      ? ((alugados + vendidos) / totalImoveis.count) * 100
      : 0;

    /* ---------------------------------------------------------
       2) LEADS
    --------------------------------------------------------- */
    let leadsQuery = supabase.from("leads").select("*", { count: "exact" });

    if (filters.leadStatus !== "all") {
      leadsQuery.eq("status", filters.leadStatus);
    }

    const leadsTotal = validate(await leadsQuery, "leads totais");

    const leadsAtivos = validate(
      await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .neq("status", "concluido")
        .neq("status", "perdido"),
      "leads ativos"
    );

    const leadStatuses = [
      "novo",
      "qualificado",
      "visita_agendada",
      "proposta_feita",
      "documentacao",
      "concluido",
      "perdido",
    ];

    const statusCounts = await Promise.all(
      leadStatuses.map((st) =>
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("status", st)
      )
    );

    const leadsPorStatus = {};
    statusCounts.forEach((res, i) => {
      validate(res, `lead status ${leadStatuses[i]}`);
      leadsPorStatus[leadStatuses[i]] = res.count || 0;
    });

    const funil_leads = leadStatuses.map((st) => ({
      etapa: st,
      valor: leadsPorStatus[st],
    }));

    /* ---------------------------------------------------------
       3) CONTRATOS
    --------------------------------------------------------- */
    const [contratosAtivos, contratosAtraso] = await Promise.all([
      supabase
        .from("contratos")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo"),

      supabase
        .from("transacoes")
        .select("*", { count: "exact", head: true })
        .lte("data_vencimento", new Date().toISOString().slice(0, 10))
        .eq("status", "pendente"),
    ]);

    validate(contratosAtivos, "contratos ativos");
    validate(contratosAtraso, "contratos atrasados");

    /* ---------------------------------------------------------
       4) PROPOSTAS
    --------------------------------------------------------- */
    const [propostasTotal, propostasAprovadas] = await Promise.all([
      supabase.from("propostas").select("*", { count: "exact", head: true }),

      supabase
        .from("propostas")
        .select("*", { count: "exact", head: true })
        .eq("status", "aprovada"),
    ]);

    validate(propostasTotal, "propostas totais");
    validate(propostasAprovadas, "propostas aprovadas");

    const taxaAprovacao =
      propostasTotal.count > 0
        ? (propostasAprovadas.count / propostasTotal.count) * 100
        : 0;

    /* ---------------------------------------------------------
       5) ORDENS DE SERVIÇO
    --------------------------------------------------------- */
    const [osAbertas, osExecucao, osConcluidas] = await Promise.all([
      fetchCount(supabase, "ordens_servico", "status", "aberta"),
      fetchCount(supabase, "ordens_servico", "status", "em_execucao"),
      fetchCount(supabase, "ordens_servico", "status", "concluida"),
    ]);

    /* ---------------------------------------------------------
       6) FINANCEIRO (transações do período)
    --------------------------------------------------------- */
    const transacoes = validate(
      await supabase
        .from("transacoes")
        .select("*")
        .gte("data_vencimento", start.toISOString())
        .lte("data_vencimento", end.toISOString()),
      "transações do período"
    );

    let receita_mes = 0;
    let despesas_mes = 0;

    const RECEITAS = ["receita_aluguel", "taxa_adm_imobiliaria"];
    const DESPESAS = [
      "repasse_proprietario",
      "comissao_corretor",
      "despesa_manutencao",
      "pagamento_iptu",
      "pagamento_condominio",
    ];

    transacoes.data?.forEach((t) => {
      const val = Number(t.valor || 0);
      if (t.status !== "pago") return;

      if (RECEITAS.includes(t.tipo)) receita_mes += val;
      if (DESPESAS.includes(t.tipo)) despesas_mes += val;
    });

    const saldo_mes = receita_mes - despesas_mes;

    /* ---------------------------------------------------------
       7) GRÁFICO — Últimos 6 meses
    --------------------------------------------------------- */
    const receitaMesesMap = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("pt-BR", { month: "short" });
      receitaMesesMap[label] = { receita: 0, despesa: 0 };
    }

    transacoes.data?.forEach((t) => {
      const d = new Date(t.data_vencimento);
      const label = d.toLocaleDateString("pt-BR", { month: "short" });
      if (!receitaMesesMap[label]) return;

      const val = Number(t.valor || 0);
      if (t.status !== "pago") return;

      if (RECEITAS.includes(t.tipo)) receitaMesesMap[label].receita += val;
      if (DESPESAS.includes(t.tipo)) receitaMesesMap[label].despesa += val;
    });

    const receita_ultimos_meses = Object.entries(receitaMesesMap).map(
      ([label, values]) => ({ label, ...values })
    );

    /* ---------------------------------------------------------
       8) DISTRIBUIÇÃO DE IMÓVEIS
    --------------------------------------------------------- */
    const tipos = ["apartamento", "casa", "terreno", "comercial", "rural"];

    const tipoCounts = await Promise.all(
      tipos.map((t) =>
        supabase
          .from("imoveis")
          .select("*", { count: "exact", head: true })
          .eq("tipo", t)
      )
    );

    const distribuicao_imoveis_tipo = tipos.map((t, idx) => ({
      tipo: t,
      total: tipoCounts[idx].count ?? 0,
    }));

    /* ---------------------------------------------------------
     9) DESTAQUES (SEM RPC, SEM RELACIONAMENTO AUTOMÁTICO)
    --------------------------------------------------------- */

    //
    // IMÓVEL DESTAQUE
    //
    const destaqueImovel = validate(
      await supabase
        .from("imoveis")
        .select("*")
        .eq("status", "disponivel")
        .order("created_at", { ascending: false })
        .limit(1),
      "imóvel destaque"
    );

    //
    // PROPOSTAS DO PERÍODO (SEM EMBED DE profiles)
    //
    const propostasPeriodo = validate(
      await supabase
        .from("propostas")
        .select("corretor_id, created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString()),
      "propostas período destaque corretor"
    );

    // Agrupar propostas por corretor
    const rankingCorretores = {};

    propostasPeriodo.data?.forEach((p) => {
      if (!p.corretor_id) return;

      if (!rankingCorretores[p.corretor_id]) {
        rankingCorretores[p.corretor_id] = {
          corretor_id: p.corretor_id,
          total: 0,
        };
      }

      rankingCorretores[p.corretor_id].total += 1;
    });

    // Se não houver dados, devolve null
    if (Object.keys(rankingCorretores).length === 0) {
      var destaqueCorretor = null;
    } else {
      // Pegar o top-1
      const arrayRank = Object.values(rankingCorretores);
      arrayRank.sort((a, b) => b.total - a.total);

      const top = arrayRank[0];

      // Buscar nome do corretor (apenas 1 query)
      const info = await supabase
        .from("profiles")
        .select("nome_completo")
        .eq("id", top.corretor_id)
        .single();

      destaqueCorretor = {
        ...top,
        nome: info.data?.nome_completo || "Corretor",
      };
    }

    /* ---------------------------------------------------------
       RESPONSE FINAL
    --------------------------------------------------------- */
    return NextResponse.json({
      imoveis: {
        total: totalImoveis.count ?? 0,
        disponiveis,
        alugados,
        vendidos,
        inativos:
          (totalImoveis.count ?? 0) - (disponiveis + alugados + vendidos),
        taxa_ocupacao,
      },

      leads: {
        total: leadsTotal.count ?? 0,
        ativos: leadsAtivos.count ?? 0,
        por_status: leadsPorStatus,
      },

      contratos: {
        ativos: contratosAtivos.count ?? 0,
        emAtraso: contratosAtraso.count ?? 0,
      },

      financeiro: {
        receita_mes,
        despesas_mes,
        saldo_mes,
      },

      propostas: {
        enviadas: propostasTotal.count ?? 0,
        aprovadas: propostasAprovadas.count ?? 0,
        taxa_aprovacao: taxaAprovacao,
      },

      ordens_servico: {
        abertas: osAbertas,
        em_execucao: osExecucao,
        concluidas: osConcluidas,
      },

      charts: {
        receita_ultimos_meses,
        funil_leads,
        distribuicao_imoveis_tipo,
      },

      destaques: {
        imovel: destaqueImovel.data?.[0] || null,
        corretor: destaqueCorretor,
      },
    });
  } catch (error) {
    console.error("🔥 Erro summary:", error);
    return NextResponse.json(
      { error: error.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}
