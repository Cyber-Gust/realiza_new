import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/alugueis/espelho_carteira?mes=YYYY-MM
 */
export async function GET(req) {
  const supabase = createServiceClient();

  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get("mes"); // YYYY-MM

    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return NextResponse.json(
        { error: "Parâmetro 'mes' inválido. Use YYYY-MM." },
        { status: 400 }
      );
    }

    /* =====================================================
       INTERVALO DO MÊS
    ===================================================== */

    const [ano, mesNum] = mes.split("-");
    const inicioMes = `${mes}-01`;
    const fimMes = new Date(ano, mesNum, 0).toISOString().slice(0, 10);

    /* =====================================================
       BUSCA DADOS CRUDOS
    ===================================================== */

    const { data: contratos, error: errContratos } = await supabase
      .from("contratos")
      .select(`
        id,
        created_at,
        rescisao_efetivada_em,
        status,
        taxa_administracao_percent,
        valor_acordado
      `);

    if (errContratos) throw errContratos;

    const { data: transacoes, error: errTransacoes } = await supabase
      .from("transacoes")
      .select(`
        tipo,
        natureza,
        valor,
        data_pagamento,
        status,
        modulo_financeiro
      `)
      .eq("modulo_financeiro", "ALUGUEL");

    if (errTransacoes) throw errTransacoes;

    /* =====================================================
       1️⃣ CONTRATOS
    ===================================================== */

    let assinados = 0;
    let rescindidos = 0;
    let acumulado = 0;

    const taxasAssinados = [];
    const taxasRescindidos = [];
    const taxasAcumulado = [];

    let aluguelTotal = 0;
    let aluguelCount = 0;

    for (const c of contratos || []) {
      if (c.status !== "cancelado") {
        acumulado++;
        taxasAcumulado.push(Number(c.taxa_administracao_percent || 0));
      }

      if (c.created_at >= inicioMes && c.created_at <= fimMes) {
        assinados++;
        taxasAssinados.push(Number(c.taxa_administracao_percent || 0));
      }

      if (
        c.rescisao_efetivada_em &&
        c.rescisao_efetivada_em >= inicioMes &&
        c.rescisao_efetivada_em <= fimMes
      ) {
        rescindidos++;
        taxasRescindidos.push(Number(c.taxa_administracao_percent || 0));
      }

      if (c.status === "vigente") {
        aluguelTotal += Number(c.valor_acordado || 0);
        aluguelCount++;
      }
    }

    const avg = (arr) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    /* =====================================================
       2️⃣ TAXA ADM (R$) — POR COMPETÊNCIA
    ===================================================== */

    let taxaAdmEntradas = 0;
    let taxaAdmSaidas = 0;
    let taxaAdmAcumulado = 0;

    let taxaContratoMes = 0;
    let taxaContratoCount = 0;

    for (const t of transacoes || []) {
      if (t.status === "cancelado") continue;
      if (!t.data_pagamento) continue;

      const competencia = t.data_pagamento.slice(0, 7);
      const valor = Number(t.valor || 0);

      if (t.tipo === "taxa_adm_imobiliaria") {
        if (t.natureza === "entrada") taxaAdmAcumulado += valor;

        if (competencia === mes) {
          if (t.natureza === "entrada") taxaAdmEntradas += valor;
          if (t.natureza === "saida") taxaAdmSaidas += valor;
        }
      }

      if (t.tipo === "taxa_contrato" && competencia === mes) {
        taxaContratoMes += valor;
        taxaContratoCount++;
      }
    }

    /* =====================================================
       RESPOSTA FINAL (FORMATO DO FRONT)
    ===================================================== */

    return NextResponse.json({
      mes,

      contratos: {
        assinados,
        rescindidos,
        saldo: assinados - rescindidos,
        acumulado,
      },

      taxa_adm_media: {
        assinados: avg(taxasAssinados),
        rescindidos: avg(taxasRescindidos),
        saldo: avg(taxasAssinados) - avg(taxasRescindidos),
        acumulado: avg(taxasAcumulado),
      },

      taxa_adm_valores: {
        entradas: taxaAdmEntradas,
        saidas: taxaAdmSaidas,
        saldo: taxaAdmEntradas - taxaAdmSaidas,
        acumulado: taxaAdmAcumulado,
      },

      taxa_contrato: {
        media: taxaContratoCount
          ? taxaContratoMes / taxaContratoCount
          : 0,
        acumulado: taxaContratoMes,
      },

      aluguel: {
        medio: aluguelCount ? aluguelTotal / aluguelCount : 0,
        acumulado: aluguelTotal,
      },
    });
  } catch (err) {
    console.error("❌ Espelho Carteira:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
