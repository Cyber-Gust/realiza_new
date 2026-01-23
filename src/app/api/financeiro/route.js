import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ======================================================
   CONSTANTES
====================================================== */

const MODULOS_PERMITIDOS = ["COMUM", "ALUGUEL"];

/* ======================================================
   HELPERS
====================================================== */

function resolverModulo(url) {
  const { searchParams } = new URL(url);
  const modulo = (searchParams.get("modulo") || "COMUM").toUpperCase();

  if (!MODULOS_PERMITIDOS.includes(modulo)) {
    throw new Error("Módulo financeiro inválido.");
  }

  return modulo;
}

async function atualizarAtrasos(supabase) {
  const hoje = new Date().toISOString().split("T")[0];

  await supabase
    .from("transacoes")
    .update({ status: "atrasado" })
    .eq("status", "pendente")
    .lt("data_vencimento", hoje);
}

function classificarFluxo(transacoes) {
  const receitas = [];
  const despesas = [];

  for (const t of transacoes) {
    if (t.natureza === "entrada") receitas.push(t);
    if (t.natureza === "saida") despesas.push(t);
  }

  return { receitas, despesas };
}

function calcularResumo(receitas, despesas) {
  const totalReceitas = receitas.reduce(
    (sum, r) => sum + Number(r.valor || 0),
    0
  );

  const totalDespesas = despesas.reduce(
    (sum, d) => sum + Number(d.valor || 0),
    0
  );

  const saldo = totalReceitas - totalDespesas;

  return {
    total_receitas: totalReceitas,
    total_despesas: totalDespesas,
    saldo,
    status_saldo: saldo > 0 ? "positivo" : saldo < 0 ? "negativo" : "neutro",
  };
}

/* ======================================================
   GET — DASHBOARD FINANCEIRO
====================================================== */

export async function GET(req) {
  const supabase = createServiceClient();

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "fluxo";

    const modulo = resolverModulo(req.url);

    // 🔄 mantém consistência contábil
    await atualizarAtrasos(supabase);

    /* ======================================================
       BASE — TRANSAÇÕES VÁLIDAS (JÁ SEPARADAS POR MÓDULO)
    ====================================================== */
    const hoje = new Date().toISOString().split("T")[0];

    const { data: transacoes, error } = await supabase
      .from("transacoes")
      .select(`
        id,
        aluguel_base_id,
        contrato_id,
        imovel_id,
        tipo,
        natureza,
        status,
        valor,
        data_vencimento,
        data_pagamento,
        descricao,
        modulo_financeiro,

        contratos (
          id,
          codigo,
          proprietario_id,
          inquilino_id,
          tipo,
          imoveis (
            id,
            codigo_ref
          )
        )
      `)
      .eq("modulo_financeiro", modulo)
      .neq("status", "cancelado")
      .lte("data_vencimento", hoje);

    if (error) throw error;

    /* ======================================================
       ENRIQUECIMENTO: LOCADOR / LOCATÁRIO (PERSONAS)
       (pra repasse vir com nome bonitinho igual no aluguel)
    ====================================================== */
    const idsPessoa = new Set();

    (transacoes || []).forEach((t) => {
      const c = t?.contratos;
      if (c?.proprietario_id) idsPessoa.add(c.proprietario_id);
      if (c?.inquilino_id) idsPessoa.add(c.inquilino_id);
    });

    const ids = Array.from(idsPessoa);

    let pessoasMap = {};
    if (ids.length > 0) {
      const { data: pessoas, error: pessoasError } = await supabase
        .from("personas")
        .select("id, nome, cpf_cnpj, telefone")
        .in("id", ids);

      if (pessoasError) throw pessoasError;

      pessoasMap = (pessoas || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
    }

    // ✅ devolve um objeto "contrato" pronto pro front usar
    const transacoesFormatadas = (transacoes || []).map((t) => {
      const c = t?.contratos;

      const locadorNome = c?.proprietario_id
        ? pessoasMap[c.proprietario_id]?.nome || ""
        : "";

      const locatarioNome = c?.inquilino_id
        ? pessoasMap[c.inquilino_id]?.nome || ""
        : "";

      const imovelCodigoRef = c?.imoveis?.codigo_ref || "";

      return {
        ...t,

        // 👇 isso aqui é o que seu front vai consumir
        contrato: {
          id: c?.id || null,
          codigo: c?.codigo || "",
          locadorNome,
          locatarioNome,
          imovelCodigoRef,
        },
      };
    });

    /* ======================================================
       FLUXO DE CAIXA (PAINEL ATUAL)
    ====================================================== */
    if (type === "fluxo") {
      const { receitas, despesas } = classificarFluxo(transacoesFormatadas);
      const resumo = calcularResumo(receitas, despesas);

      return NextResponse.json({
        data: transacoesFormatadas,
        meta: {
          ...resumo,
          total_lancamentos: transacoesFormatadas.length,
          modulo,
        },
      });
    }

    /* ======================================================
       RESUMO EXECUTIVO (KPIs)
    ====================================================== */
    if (type === "resumo") {
      const { receitas, despesas } = classificarFluxo(transacoesFormatadas);
      const resumo = calcularResumo(receitas, despesas);

      // 📌 inadimplência só de ENTRADAS (faz sentido real)
      const inadimplentes = transacoesFormatadas.filter(
        (t) =>
          t.natureza === "entrada" &&
          (t.status === "pendente" || t.status === "atrasado")
      );

      return NextResponse.json({
        data: [],
        meta: {
          ...resumo,
          total_inadimplentes: inadimplentes.length,
          valor_inadimplente: inadimplentes.reduce(
            (sum, t) => sum + Number(t.valor || 0),
            0
          ),
          modulo,
        },
      });
    }

    /* ======================================================
       LANÇAMENTOS GERAIS
    ====================================================== */
    if (type === "lancamentos") {
      return NextResponse.json({
        data: transacoesFormatadas.sort(
          (a, b) => new Date(b.data_vencimento) - new Date(a.data_vencimento)
        ),
        meta: { total: transacoesFormatadas.length, modulo },
      });
    }

    return NextResponse.json(
      { error: "Tipo de consulta inválido." },
      { status: 400 }
    );
  } catch (err) {
    console.error("❌ Financeiro dashboard:", err);

    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}

/* ======================================================
   BLOQUEIOS ABSOLUTOS
====================================================== */

export async function POST() {
  return NextResponse.json(
    { error: "Operação não permitida em financeiro." },
    { status: 403 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Operação não permitida em financeiro." },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Operação não permitida em financeiro." },
    { status: 403 }
  );
}
