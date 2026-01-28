import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import dayjs from "dayjs";

export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();

    const {
      tipos = [],                // receita_aluguel | taxa_adm_imobiliaria | taxa_contrato
      base_data = "vencimento",  // vencimento | pagamento
      meses = []                 // ["2026-01", "2026-02"]
    } = body;

    if (!tipos.length || !meses.length) {
      return NextResponse.json(
        { error: "Tipos e meses são obrigatórios" },
        { status: 400 }
      );
    }

    const campoData =
      base_data === "pagamento"
        ? "data_pagamento"
        : "data_vencimento";

    /* ===========================================
       RANGE GLOBAL DE DATAS
    ============================================ */

    const datasInicio = meses
      .map(m => dayjs(`${m}-01`))
      .sort((a, b) => a.valueOf() - b.valueOf());

    const dataInicio = datasInicio[0].format("YYYY-MM-DD");
    const dataFim = datasInicio[datasInicio.length - 1]
      .add(1, "month")
      .format("YYYY-MM-DD");

    /* ===========================================
       BUSCA TRANSAÇÕES
    ============================================ */

    const { data: transacoes, error } = await supabase
      .from("transacoes")
      .select(`
        id,
        aluguel_base_id,
        contrato_id,
        tipo,
        natureza,
        valor,
        ${campoData}
      `)
      .eq("modulo_financeiro", "ALUGUEL")
      .neq("status", "cancelado")
      .gte(campoData, dataInicio)
      .lt(campoData, dataFim);

    if (error) throw error;

    const mesesSet = new Set(meses);

    const validas = transacoes.filter(t =>
      t[campoData] &&
      mesesSet.has(dayjs(t[campoData]).format("YYYY-MM"))
    );

    /* ===========================================
       MAPA DE ALUGUÉIS BASE
    ============================================ */

    const alugueisBase = new Map();

    for (const t of validas) {
      if (t.tipo !== "receita_aluguel") continue;

      alugueisBase.set(t.id, {
        contrato_id: t.contrato_id,
        data: t[campoData],
        valor_base: Number(t.valor),
        ajustes_entrada: 0,
        ajustes_saida: 0,
      });
    }

    /* ===========================================
       AJUSTES VINCULADOS
    ============================================ */

    for (const t of validas) {
      if (!t.aluguel_base_id) continue;

      const base = alugueisBase.get(t.aluguel_base_id);
      if (!base) continue;

      const valor = Number(t.valor);

      if (t.natureza === "entrada") {
        base.ajustes_entrada += valor;
      }

      if (t.natureza === "saida") {
        base.ajustes_saida += valor;
      }
    }

    /* ===========================================
       AGREGAÇÃO POR DIA
    ============================================ */

    let totalGeral = 0;
    const porDia = {}; // { dia: { total, contratos:Set } }

    function acumular(dia, valor, contratoId) {
      totalGeral += valor;

      if (!porDia[dia]) {
        porDia[dia] = {
          dia,
          total: 0,
          contratos: new Set(),
        };
      }

      porDia[dia].total += valor;
      if (contratoId) {
        porDia[dia].contratos.add(contratoId);
      }
    }

    /* ===========================================
       1️⃣ ALUGUEL LÍQUIDO
    ============================================ */

    if (tipos.includes("receita_aluguel")) {
      for (const base of alugueisBase.values()) {
        const liquido =
          base.valor_base
          - base.ajustes_saida
          + base.ajustes_entrada;

        const dia = dayjs(base.data).date();
        acumular(dia, liquido, base.contrato_id);
      }
    }

    /* ===========================================
       2️⃣ TAXAS SEM BASE
    ============================================ */

    for (const t of validas) {
      if (t.aluguel_base_id) continue;
      if (!tipos.includes(t.tipo)) continue;

      if (
        t.tipo !== "taxa_adm_imobiliaria" &&
        t.tipo !== "taxa_contrato"
      ) continue;

      const dia = dayjs(t[campoData]).date();
      acumular(dia, Number(t.valor), t.contrato_id);
    }

    /* ===========================================
       RESULTADO FINAL
    ============================================ */

    const dias = Object.values(porDia)
      .map(d => ({
        dia: d.dia,
        quantidade_contratos: d.contratos.size,
        valor: Number(d.total.toFixed(2)),
        percentual: totalGeral
          ? Number(((d.total / totalGeral) * 100).toFixed(2))
          : 0,
      }))
      .sort((a, b) => a.dia - b.dia);

    return NextResponse.json({
      filtros: { tipos, base_data, meses },
      total_geral: Number(totalGeral.toFixed(2)),
      dias,
    });

  } catch (err) {
    console.error("❌ Recebimento diário:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
