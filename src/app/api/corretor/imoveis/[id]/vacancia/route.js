import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req, context) {
  const { id } = await context.params;

  try {
    const supabase = createServiceClient();

    // Buscar o último contrato do imóvel
    const { data: contratos, error } = await supabase
      .from("contratos")
      .select("id, data_fim, status, tipo, valor_acordado")
      .eq("imovel_id", id)
      .order("data_fim", { ascending: false })
      .limit(1);

    if (error) throw error;

    const contrato = contratos?.[0] || null;

    /* =======================================================
       🌟 1. Sem contrato nenhum
    ======================================================= */
    if (!contrato) {
      return NextResponse.json({
        vacancia: {
          status: "sem_contrato",
          dias: null,
          ultimo_contrato: null
        }
      });
    }

    const hoje = new Date();
    const fim = new Date(contrato.data_fim);

    /* =======================================================
       🌟 2. Contrato ainda vigente
    ======================================================= */
    if (fim >= hoje && contrato.status === "ativo") {
      return NextResponse.json({
        vacancia: {
          status: "contrato_ativo",
          dias: 0,
          ultimo_contrato: contrato
        }
      });
    }

    /* =======================================================
       🌟 3. Contrato encerrado → calcular vacância
    ======================================================= */
    const diff = Math.floor((hoje - fim) / (1000 * 60 * 60 * 24));
    const dias = diff > 0 ? diff : 0;

    return NextResponse.json({
      vacancia: {
        status: "em_vacancia",
        dias,
        ultimo_contrato: contrato
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
