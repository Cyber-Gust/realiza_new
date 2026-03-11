import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function validate(res, label) {
  if (res.error) {
    throw new Error(
      `Erro ao buscar ${label}: ${res.error.message || "erro desconhecido"}`
    );
  }
  return res.data ?? [];
}

export async function GET(req) {
  try {
    const supabase = createServiceClient();

    const { searchParams } = new URL(req.url);
    const corretorId = searchParams.get("corretor_id");

    if (!corretorId) {
      return NextResponse.json(
        { error: "corretor_id não informado" },
        { status: 400 }
      );
    }

    const [imoveisRes, leadsRes] = await Promise.all([
      supabase
        .from("imoveis")
        .select("id, codigo_ref, titulo, status, created_at, imagem_principal")
        .eq("corretor_id", corretorId)
        .order("created_at", { ascending: false })
        .limit(1),

      supabase
        .from("leads")
        .select("id, nome, telefone, status, created_at")
        .eq("corretor_id", corretorId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const imoveis = validate(imoveisRes, "imóveis recentes");
    const leads = validate(leadsRes, "leads recentes");

    return NextResponse.json({
      imoveis,
      leads,
    });

  } catch (error) {
    console.error("Erro dashboard recents:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}