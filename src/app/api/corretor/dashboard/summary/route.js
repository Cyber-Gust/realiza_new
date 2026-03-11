import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function getDateRange(periodo) {
  const now = new Date();
  const start = new Date(now);

  if (periodo === "7d") start.setDate(start.getDate() - 7);
  if (periodo === "30d") start.setDate(start.getDate() - 30);
  if (periodo === "90d") start.setDate(start.getDate() - 90);
  if (periodo === "12m") start.setFullYear(start.getFullYear() - 1);

  return { start, end: now };
}

export async function GET(req) {
  try {
    const supabase = createServiceClient();

    const { searchParams } = new URL(req.url);

    const corretorId = searchParams.get("corretor_id");
    const periodo = searchParams.get("periodo") || "30d";

    if (!corretorId) {
      return NextResponse.json(
        { error: "corretor_id não informado" },
        { status: 400 }
      );
    }

    const { start, end } = getDateRange(periodo);

    const [imoveis, leads, transacoes, destaque] = await Promise.all([

      supabase
        .from("imoveis")
        .select("id", { count: "exact", head: true })
        .eq("corretor_id", corretorId),

      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("corretor_id", corretorId),

      supabase
        .from("transacoes")
        .select("*")
        .eq("corretor_id", corretorId)
        .gte("data_vencimento", start.toISOString())
        .lte("data_vencimento", end.toISOString()),

      supabase
        .from("imoveis")
        .select("*")
        .eq("corretor_id", corretorId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    let saldo = 0;

    transacoes.data?.forEach(t => {
      if (t.status !== "pago") return;
      saldo += Number(t.valor || 0);
    });

    return NextResponse.json({
      imoveis: { total: imoveis.count || 0 },
      leads: { total: leads.count || 0 },
      financeiro: { saldo_mes: saldo },
      destaques: { imovel: destaque.data?.[0] || null }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}