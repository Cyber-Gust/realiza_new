import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const MODULO = "ALUGUEL";

/* ======================================================
   GET — LISTAR RECORRÊNCIAS DO CONTRATO
====================================================== */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const contratoId = searchParams.get("contrato_id");

  if (!contratoId) {
    return NextResponse.json(
      { error: "contrato_id é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("transacoes")
      .select(`
        id,
        contrato_id,
        tipo,
        natureza,
        status,
        descricao,
        valor,
        data_vencimento,
        dados_cobranca_json,
        created_at
      `)
      .eq("contrato_id", contratoId)
      .eq("modulo_financeiro", MODULO)
      .neq("status", "cancelado")
      .order("data_vencimento", { ascending: true });

    if (error) throw error;

    // --------- agrupa por tipo + descricao
    const map = {};

    for (const t of data) {
      const key = `${t.tipo}|${t.descricao}`;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }

    // --------- filtra apenas recorrentes
    const recorrentes = Object.values(map)
      .filter((grupo) => {
        const json = grupo[0]?.dados_cobranca_json || {};
        if (json.recorrencia === "fixo") return true;
        if (json.recorrencia === "parcelas") return true;
        return grupo.length >= 2;
      })
      .flat();

    return NextResponse.json({ data: recorrentes });
  } catch (err) {
    console.error("❌ GET recorrencias:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/* ======================================================
   POST — CRIAR (DELEGA PARA A ROTA DE LANÇAMENTOS)
====================================================== */
export async function POST(req) {
  // 👉 aqui você pode:
  // 1) duplicar a lógica da rota de lançamentos
  // 2) OU chamar ela internamente (fetch server-side)
  return NextResponse.json(
    { error: "Use a rota /api/alugueis/lancamentos para criação." },
    { status: 409 }
  );
}

/* ======================================================
   PATCH — EDITAR UM LANÇAMENTO (APENAS PENDENTE)
====================================================== */
export async function PATCH(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();
    const { id, descricao, valor, data_vencimento } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id do lançamento é obrigatório." },
        { status: 400 }
      );
    }

    const { data: atual, error: e1 } = await supabase
      .from("transacoes")
      .select("status")
      .eq("id", id)
      .single();

    if (e1 || !atual) {
      return NextResponse.json(
        { error: "Lançamento não encontrado." },
        { status: 404 }
      );
    }

    if (atual.status !== "pendente") {
      return NextResponse.json(
        { error: "Só é possível editar lançamentos pendentes." },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("transacoes")
      .update({
        descricao,
        valor,
        data_vencimento,
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ PATCH recorrencia:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/* ======================================================
   DELETE — CANCELAR UM LANÇAMENTO (APENAS PENDENTE)
====================================================== */
export async function DELETE(req) {
  const supabase = createServiceClient();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório." },
        { status: 400 }
      );
    }

    const { data: atual, error: e1 } = await supabase
      .from("transacoes")
      .select("status")
      .eq("id", id)
      .single();

    if (e1 || !atual) {
      return NextResponse.json(
        { error: "Lançamento não encontrado." },
        { status: 404 }
      );
    }

    if (atual.status !== "pendente") {
      return NextResponse.json(
        { error: "Só é possível cancelar lançamentos pendentes." },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("transacoes")
      .update({ status: "cancelado" })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE recorrencia:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
