import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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
export async function GET() {
  const supabase = createServiceClient();

  try {
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
      .order("data_vencimento", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      meta: {
        total: data?.length || 0,
      },
    });

  } catch (err) {
    console.error("❌ Inadimplência GET:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
