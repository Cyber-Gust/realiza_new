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

/* ======================================================
   🔄 ATUALIZAR RECEITAS EM ATRASO
====================================================== */
async function atualizarAtrasos(supabase) {
  const hoje = new Date().toISOString().split("T")[0];

  await supabase
    .from("transacoes")
    .update({ status: "atrasado" })
    .eq("natureza", "entrada")
    .eq("status", "pendente")
    .lt("data_vencimento", hoje);
}

/* ======================================================
   GET — INADIMPLÊNCIA (AGRUPADA POR ALUGUEL)
====================================================== */
export async function GET(req) {
  const supabase = createServiceClient();

  try {
    const modulo = resolverModulo(req.url);

    // 🔒 consistência antes da leitura
    await atualizarAtrasos(supabase);

    /**
     * ✅ REGRA DO SISTEMA:
     * inadimplência no módulo ALUGUEL deve considerar o valor REAL do aluguel do mês:
     * (aluguel base + entradas acopladas - saídas acopladas)
     *
     * Então:
     * - buscamos os aluguéis base atrasados
     * - buscamos os itens vinculados ao aluguel_base_id
     * - calculamos o valor final
     */

    // ✅ 1) pega apenas os aluguéis base atrasados (receita_aluguel pai)
    const { data: bases, error: baseError } = await supabase
      .from("transacoes")
      .select(`
        id,
        valor,
        status,
        data_vencimento,
        descricao,
        natureza,
        modulo_financeiro,
        contrato_id,
        imovel_id,

        imovel:imoveis(
          id,
          titulo,
          codigo_ref
        ),

        contrato:contratos(
          id,
          codigo,
          proprietario:proprietario_id(
            id,
            nome,
            email
          ),
          inquilino:inquilino_id(
            id,
            nome,
            email
          )
        )
      `)
      .eq("tipo", "receita_aluguel")
      .eq("natureza", "entrada")
      .eq("status", "atrasado")
      .eq("modulo_financeiro", modulo)
      .order("data_vencimento", { ascending: true });

    if (baseError) throw baseError;

    if (!bases?.length) {
      return NextResponse.json({
        data: [],
        meta: {
          total: 0,
          modulo,
        },
      });
    }

    const baseIds = bases.map((b) => b.id);

    // ✅ 2) buscar itens filhos vinculados aos aluguéis base
    const { data: itens, error: itensError } = await supabase
      .from("transacoes")
      .select(`
        id,
        aluguel_base_id,
        tipo,
        natureza,
        status,
        valor,
        descricao,
        data_vencimento
      `)
      .in("aluguel_base_id", baseIds)
      .neq("status", "cancelado");

    if (itensError) throw itensError;

    // ✅ 3) mapear itens por aluguel_base_id
    const itensMap = new Map();
    for (const it of itens || []) {
      if (!it.aluguel_base_id) continue;
      if (!itensMap.has(it.aluguel_base_id)) itensMap.set(it.aluguel_base_id, []);
      itensMap.get(it.aluguel_base_id).push(it);
    }

    // ✅ 4) monta retorno final com valor real calculado
    const inadimplentes = (bases || []).map((b) => {
      const filhos = itensMap.get(b.id) || [];

      const entradasFilhos = filhos
        .filter((x) => x.natureza === "entrada")
        .reduce((sum, x) => sum + Number(x.valor || 0), 0);

      const saidasFilhos = filhos
        .filter((x) => x.natureza === "saida")
        .reduce((sum, x) => sum + Number(x.valor || 0), 0);

      const valorTotalGrupo =
        Number(b.valor || 0) + Number(entradasFilhos) - Number(saidasFilhos);

      return {
        ...b,

        // ✅ esse é o valor que você quer mostrar na Inadimplência
        valor_calculado: Number(valorTotalGrupo.toFixed(2)),

        // ✅ se quiser o front montar detalhado
        itens: filhos,
      };
    });

    return NextResponse.json({
      data: inadimplentes,
      meta: {
        total: inadimplentes.length,
        modulo,
      },
    });
  } catch (err) {
    console.error("❌ Inadimplência GET:", err);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
