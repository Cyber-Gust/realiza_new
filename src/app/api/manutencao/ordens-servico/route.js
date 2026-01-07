import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* =====================================================
   HELPERS
===================================================== */
const hasApprovedBudget = (orcamentos = []) =>
  orcamentos.some((o) => o.status === "aprovado");

/* =====================================================
   GET
===================================================== */
export async function GET(req) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const imovel_id = searchParams.get("imovel_id");
  const contrato_id = searchParams.get("contrato_id");

  try {
    let query = supabase
      .from("ordens_servico")
      .select(
        `
        id,
        nome,
        descricao_problema,
        status,
        orcamentos_json,
        custo_final,
        prestador_aprovado,
        imovel_id,
        contrato_id,
        solicitante_id,
        created_at,
        updated_at,

        imovel:imoveis (
          id,
          titulo,
          codigo_ref,
          endereco_cidade,
          endereco_estado
        ),

        contrato:contratos (
          id,
          tipo
        ),

        solicitante:profiles (
          id,
          nome_completo
        )
        `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") query = query.eq("status", status);
    if (imovel_id) query = query.eq("imovel_id", imovel_id);
    if (contrato_id) query = query.eq("contrato_id", contrato_id);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      meta: {
        total_registros: count ?? data?.length ?? 0,
      },
    });
  } catch (err) {
    console.error("❌ GET ordens-servico:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =====================================================
   POST
===================================================== */
export async function POST(req) {
  const supabase = await createClient();

  try {
    const body = await req.json();
    const { nome, imovel_id, contrato_id, descricao_problema } = body;

    if (!nome)
    return NextResponse.json(
      { error: "Nome da OS é obrigatório." },
      { status: 400 }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );

    if (!imovel_id || !descricao_problema)
      return NextResponse.json(
        { error: "Imóvel e descrição são obrigatórios." },
        { status: 400 }
      );

    const { data, error } = await supabase
      .from("ordens_servico")
      .insert([
        {
          nome,
          imovel_id,
          contrato_id: contrato_id || null,
          solicitante_id: user.id,
          descricao_problema,
          status: "aberta",
          orcamentos_json: [],
          prestador_aprovado: null,
          custo_final: null,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({
      message: "Ordem de serviço criada com sucesso.",
      data,
    });
  } catch (err) {
    console.error("❌ POST ordens-servico:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =====================================================
   PUT
===================================================== */
export async function PUT(req) {
  const supabase = await createClient();

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id)
      return NextResponse.json(
        { error: "ID obrigatório." },
        { status: 400 }
      );

    const { data: current, error: findError } = await supabase
      .from("ordens_servico")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !current)
      return NextResponse.json(
        { error: "Ordem não encontrada." },
        { status: 404 }
      );

    const orcamentos =
      updates.orcamentos_json ?? current.orcamentos_json ?? [];

    const nextStatus = updates.status ?? current.status;

    /* =========================
       REGRAS DE NEGÓCIO
    ========================= */

    if (nextStatus === "orcamento" && orcamentos.length === 0)
      return NextResponse.json(
        { error: "Não é possível entrar em orçamento sem orçamentos." },
        { status: 400 }
      );

    if (
      nextStatus === "aprovada_pelo_proprietario" &&
      !hasApprovedBudget(orcamentos)
    )
      return NextResponse.json(
        { error: "Nenhum orçamento aprovado." },
        { status: 400 }
      );

    if (
      nextStatus === "concluida" &&
      !(updates.custo_final ?? current.custo_final)
    )
      return NextResponse.json(
        { error: "Custo final obrigatório para concluir a OS." },
        { status: 400 }
      );

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("ordens_servico")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;

    return NextResponse.json({
      message: "Ordem de serviço atualizada.",
      data,
    });
  } catch (err) {
    console.error("❌ PUT ordens-servico:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =====================================================
   DELETE
===================================================== */
export async function DELETE(req) {
  const supabase = await createClient();

  try {
    const body = await req.json();
    if (!body?.id)
      return NextResponse.json(
        { error: "ID obrigatório." },
        { status: 400 }
      );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );

    const { error } = await supabase
      .from("ordens_servico")
      .delete()
      .eq("id", body.id);

    if (error) throw error;

    return NextResponse.json({
      message: "Ordem de serviço removida.",
    });
  } catch (err) {
    console.error("❌ DELETE ordens-servico:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
