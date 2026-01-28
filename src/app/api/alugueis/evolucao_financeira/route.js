import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ======================================================
   HELPERS DE DATA
====================================================== */

function hojeISO() {
  return new Date().toISOString().split("T")[0];
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function resolverPeriodo(searchParams) {
  const periodo = searchParams.get("periodo") || "30d";
  const hoje = hojeISO();

  switch (periodo) {
    case "hoje":
      return { inicio: hoje, fim: hoje };

    case "ontem": {
      const ontem = addDays(hoje, -1);
      return { inicio: ontem, fim: ontem };
    }

    case "7d":
      return { inicio: addDays(hoje, -6), fim: hoje };

    case "30d":
      return { inicio: addDays(hoje, -29), fim: hoje };

    case "custom":
      return {
        inicio: searchParams.get("dataInicio"),
        fim: searchParams.get("dataFim"),
      };

    default:
      return { inicio: addDays(hoje, -29), fim: hoje };
  }
}

/* ======================================================
   GET — EVOLUÇÃO FINANCEIRA (MODELO CORRETO)
====================================================== */

export async function GET(req) {
  const supabase = createServiceClient();

  try {
    const { searchParams } = new URL(req.url);

    const considerarDataDe =
      searchParams.get("considerarDataDe") || "pagamento";

    const campoData =
      considerarDataDe === "vencimento"
        ? "data_vencimento"
        : "data_pagamento";

    const { inicio, fim } = resolverPeriodo(searchParams);

    if (!inicio || !fim) {
      return NextResponse.json(
        { error: "Período inválido." },
        { status: 400 }
      );
    }

    /* ===========================================
       BUSCA TODAS AS TRANSAÇÕES DO PERÍODO
    ============================================ */

    const { data, error } = await supabase
      .from("transacoes")
      .select(`
        id,
        aluguel_base_id,
        tipo,
        natureza,
        valor,
        ${campoData}
      `)
      .eq("status", "pago")
      .eq("modulo_financeiro", "ALUGUEL")
      .gte(campoData, inicio)
      .lte(campoData, fim);

    if (error) throw error;

    /* ===========================================
       MAPA DE ALUGUÉIS BASE
    ============================================ */

    const alugueisBase = new Map();

    for (const t of data || []) {
      if (t.tipo !== "receita_aluguel") continue;
      if (!t[campoData]) continue;

      alugueisBase.set(t.id, {
        competencia: t[campoData].slice(0, 7),
        aluguel_base: Number(t.valor),
        ajustes_entrada: 0,
        ajustes_saida: 0,
      });
    }

    /* ===========================================
       AJUSTES VINCULADOS AO ALUGUEL
    ============================================ */

    for (const t of data || []) {
      if (!t.aluguel_base_id) continue;

      const grupo = alugueisBase.get(t.aluguel_base_id);
      if (!grupo) continue;

      const valor = Number(t.valor);

      if (t.natureza === "entrada") {
        grupo.ajustes_entrada += valor;
      }

      if (t.natureza === "saida") {
        grupo.ajustes_saida += valor;
      }
    }

    /* ===========================================
       AGREGAÇÃO POR COMPETÊNCIA
    ============================================ */

    const porMes = new Map();

    // 1️⃣ Aluguel bruto mensal
    for (const g of alugueisBase.values()) {
      const aluguelBruto =
        g.aluguel_base
        - g.ajustes_saida
        + g.ajustes_entrada;

      if (!porMes.has(g.competencia)) {
        porMes.set(g.competencia, {
          competencia: g.competencia,
          aluguel_bruto: 0,
          taxa_adm: 0,
          taxa_contrato: 0,
          aluguel_liquido: 0,
        });
      }

      porMes.get(g.competencia).aluguel_bruto += aluguelBruto;
    }

    // 2️⃣ Taxas por competência (SEM base_id)
    for (const t of data || []) {
      if (!t[campoData]) continue;

      const competencia = t[campoData].slice(0, 7);
      const acc = porMes.get(competencia);
      if (!acc) continue;

      const valor = Number(t.valor);

      if (t.tipo === "taxa_adm_imobiliaria") {
        acc.taxa_adm += valor;
      }

      if (t.tipo === "taxa_contrato") {
        acc.taxa_contrato += valor;
      }
    }

    // 3️⃣ Aluguel líquido mensal
    for (const acc of porMes.values()) {
      acc.aluguel_liquido =
        acc.aluguel_bruto
        - acc.taxa_adm
        - acc.taxa_contrato;
    }

    const tabela = Array.from(porMes.values()).sort((a, b) =>
      a.competencia.localeCompare(b.competencia)
    );

    return NextResponse.json({
      labels: tabela.map((t) => t.competencia),
      series: {
        aluguel_bruto: tabela.map((t) => t.aluguel_bruto),
        aluguel_liquido: tabela.map((t) => t.aluguel_liquido),
        taxa_adm: tabela.map((t) => t.taxa_adm),
        taxa_contrato: tabela.map((t) => t.taxa_contrato),
      },
      tabela,
      periodo: { inicio, fim },
      considerarDataDe: campoData,
    });
  } catch (err) {
    console.error("❌ Evolução Financeira:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
