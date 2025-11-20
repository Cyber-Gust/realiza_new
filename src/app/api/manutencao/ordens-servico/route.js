import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 🧰 API — Ordens de Serviço
 * 
 * Funcionalidades:
 *  - GET: Listagem (filtros opcionais)
 *  - POST: Criação (solicitante = usuário logado)
 *  - PUT: Atualização
 *  - DELETE: Exclusão
 */

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
        imovel_id,
        contrato_id,
        solicitante_id,
        descricao_problema,
        status,
        orcamentos_json,
        custo_final,
        prestador_aprovado,
        created_at,
        updated_at
      `,
        { count: "exact" }
      );

    // 🔹 Filtros opcionais
    if (status && status !== "all") query = query.eq("status", status);
    if (imovel_id) query = query.eq("imovel_id", imovel_id);
    if (contrato_id) query = query.eq("contrato_id", contrato_id);

    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;

    // 🔹 Dados complementares
    const imoveisIds = [...new Set(data.map((d) => d.imovel_id).filter(Boolean))];
    const contratosIds = [...new Set(data.map((d) => d.contrato_id).filter(Boolean))];
    const perfisIds = [...new Set(data.map((d) => d.solicitante_id).filter(Boolean))];

    const [imoveisRes, contratosRes, perfisRes] = await Promise.all([
      imoveisIds.length
        ? supabase.from("imoveis").select("id, titulo, endereco_cidade, endereco_estado").in("id", imoveisIds)
        : { data: [] },
      contratosIds.length
        ? supabase.from("contratos").select("id, tipo, valor_acordado, data_inicio, data_fim").in("id", contratosIds)
        : { data: [] },
      perfisIds.length
        ? supabase.from("profiles").select("id, nome_completo, role").in("id", perfisIds)
        : { data: [] },
    ]);

    const imoveisMap = Object.fromEntries((imoveisRes.data || []).map((i) => [i.id, i]));
    const contratosMap = Object.fromEntries((contratosRes.data || []).map((c) => [c.id, c]));
    const perfisMap = Object.fromEntries((perfisRes.data || []).map((p) => [p.id, p]));

    const enriched = data.map((os) => ({
      ...os,
      imovel: imoveisMap[os.imovel_id] || null,
      contrato: contratosMap[os.contrato_id] || null,
      solicitante: perfisMap[os.solicitante_id] || null,
    }));

    return NextResponse.json({
      data: enriched,
      meta: { total_registros: count || enriched.length },
    });
  } catch (err) {
    console.error("❌ Erro em /api/manutencao/ordens-servico [GET]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const supabase = await createClient();

  try {
    const body = await req.json();
    const {
      imovel_id,
      contrato_id,
      descricao_problema,
      orcamentos_json = [],
      prestador_aprovado = null,
      custo_final = null,
    } = body;

    // 🔒 Pega usuário logado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user)
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });

    if (!imovel_id || !descricao_problema)
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (imovel_id, descricao_problema)." },
        { status: 400 }
      );

    // 💾 Insere OS
    const { data, error } = await supabase.from("ordens_servico").insert([
      {
        imovel_id,
        contrato_id: contrato_id || null,
        solicitante_id: user.id, // 👈 vem do usuário logado
        descricao_problema,
        status: "aberta",
        orcamentos_json,
        prestador_aprovado,
        custo_final,
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ message: "Ordem de serviço criada com sucesso.", data });
  } catch (err) {
    console.error("❌ Erro em /api/manutencao/ordens-servico [POST]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const supabase = await createClient(); // 👈 usa o client autenticado, não o service
  try {
    // Verifica se veio corpo
    let body = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo da requisição inválido ou ausente." }, { status: 400 });
    }

    const { id } = body;
    if (!id)
      return NextResponse.json({ error: "ID obrigatório para exclusão." }, { status: 400 });

    // 🔒 (opcional) garante que a OS pertence ao usuário logado
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });

    // 🔥 Deleta
    const { error } = await supabase.from("ordens_servico").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Ordem de serviço removida com sucesso." });
  } catch (err) {
    console.error("❌ Erro em /api/manutencao/ordens-servico [DELETE]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const supabase = await createClient();
  try {
    // 🔸 Tenta ler o body com segurança
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo da requisição inválido ou ausente." }, { status: 400 });
    }

    const { id, ...updates } = body;
    if (!id)
      return NextResponse.json({ error: "ID obrigatório para atualização." }, { status: 400 });

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("ordens_servico")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;

    return NextResponse.json({
      message: "Ordem de serviço atualizada com sucesso.",
      data,
    });
  } catch (err) {
    console.error("❌ Erro em /api/manutencao/ordens-servico [PUT]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}