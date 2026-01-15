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
   GET — INADIMPLÊNCIA (RECEITAS EM ATRASO)
====================================================== */
export async function GET(req) {
  const supabase = createServiceClient();

  try {
    const modulo = resolverModulo(req.url);

    // 🔒 consistência antes da leitura
    await atualizarAtrasos(supabase);

    const { data, error } = await supabase
      .from("transacoes")
      .select(`
        id,
        valor,
        status,
        data_vencimento,
        descricao,
        natureza,
        modulo_financeiro,

        imovel:imoveis(
          id,
          titulo,
          codigo_ref
        ),

        contrato:contratos(
          id,
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
      .eq("natureza", "entrada")
      .eq("status", "atrasado")
      .eq("modulo_financeiro", modulo)
      .order("data_vencimento", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      meta: {
        total: data?.length || 0,
        modulo,
      },
    });
  } catch (err) {
    console.error("❌ Inadimplência GET:", err);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
