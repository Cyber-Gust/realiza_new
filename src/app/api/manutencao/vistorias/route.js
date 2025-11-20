import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 🧾 API — Vistorias
 * 
 * Funcionalidades:
 *  - GET: Listagem com filtros (imovel_id, contrato_id, tipo)
 *  - POST: Criação de vistoria (upload de laudo no bucket)
 *  - PUT: Atualização (descrição, laudo, data, etc.)
 *  - DELETE: Exclusão
 */

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const imovel_id = searchParams.get("imovel_id");
  const contrato_id = searchParams.get("contrato_id");
  const tipo = searchParams.get("tipo");

  try {
    let query = supabase
      .from("vistorias")
      .select(
        `
        id,
        imovel_id,
        contrato_id,
        tipo,
        data_vistoria,
        laudo_descricao,
        documento_laudo_url,
        created_at
      `,
        { count: "exact" }
      );

    if (imovel_id) query = query.eq("imovel_id", imovel_id);
    if (contrato_id) query = query.eq("contrato_id", contrato_id);
    if (tipo) query = query.ilike("tipo", `%${tipo}%`);

    query = query.order("data_vistoria", { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;

    const imoveisIds = [...new Set(data.map((d) => d.imovel_id).filter(Boolean))];
    const contratosIds = [...new Set(data.map((d) => d.contrato_id).filter(Boolean))];

    const [imoveisRes, contratosRes] = await Promise.all([
      imoveisIds.length
        ? supabase.from("imoveis").select("id, titulo, endereco_cidade, endereco_estado").in("id", imoveisIds)
        : { data: [] },
      contratosIds.length
        ? supabase.from("contratos").select("id, tipo, valor_acordado, data_inicio, data_fim").in("id", contratosIds)
        : { data: [] },
    ]);

    const imoveisMap = Object.fromEntries((imoveisRes.data || []).map((i) => [i.id, i]));
    const contratosMap = Object.fromEntries((contratosRes.data || []).map((c) => [c.id, c]));

    const enriched = data.map((v) => ({
      ...v,
      imovel: imoveisMap[v.imovel_id] || null,
      contrato: contratosMap[v.contrato_id] || null,
    }));

    return NextResponse.json({
      data: enriched,
      meta: { total_registros: count || enriched.length },
    });
  } catch (err) {
    console.error("❌ Erro em /api/manutencao/vistorias [GET]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();
    const { imovel_id, contrato_id, tipo, data_vistoria, laudo_descricao, documento_laudo_url } = body;

    if (!imovel_id || !tipo || !data_vistoria)
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });

    const { data, error } = await supabase.from("vistorias").insert([
      {
        imovel_id,
        contrato_id: contrato_id || null,
        tipo,
        data_vistoria,
        laudo_descricao,
        documento_laudo_url, // 👈 URL do arquivo salvo no bucket 'documentos_vistorias'
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ message: "Vistoria criada com sucesso.", data });
  } catch (err) {
    console.error("❌ Erro em /api/manutencao/vistorias [POST]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
