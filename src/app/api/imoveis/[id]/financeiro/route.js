import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const vacancia = searchParams.get("vacancia");

  const supabase = createServiceClient();

  try {
    if (vacancia) {
      const { data: contratos } = await supabase
        .from("contratos")
        .select("data_fim")
        .eq("imovel_id", id)
        .order("data_fim", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!contratos) return NextResponse.json({ dias: 0 });

      const dataFim = new Date(contratos.data_fim);
      const diff = Math.max(0, (Date.now() - dataFim.getTime()) / (1000 * 60 * 60 * 24));

      return NextResponse.json({
        dias: Math.floor(diff),
        ultimo_contrato: { data_fim: contratos.data_fim },
      });
    }

    return NextResponse.json({ data: "Endpoint financeiro pronto." });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
