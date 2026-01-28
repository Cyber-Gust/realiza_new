import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const TIPOS_GARANTIA_VALIDOS = [
  "pessoa_fisica",
  "pessoa_juridica",
  "fiador",
  "seguro_fianca",
  "deposito_caucao",
  "titulo_capitalizacao",
  "sem_garantias",
  "carta_fianca_bancaria",
  "garantia_real",
  "carta_fianca_empresa",
  "caucao_imovel",
  "locador_solidario",
  "locatario_solidario",
  "fianca_digital",
  "seguro_gratuito",
  "carta_fianca_estado",
];

export async function GET(req) {
  const supabase = createServiceClient();

  try {
    const { searchParams } = new URL(req.url);

    // 🎛️ filtros
    const tipoGarantia = searchParams.get("tipo_garantia");
    const contratoCodigo = searchParams.get("contrato");
    const locador = searchParams.get("locador");
    const locatario = searchParams.get("locatario");
    const dataInicio = searchParams.get("data_inicio");
    const dataFim = searchParams.get("data_fim");

    // 🛑 valida tipo de garantia
    if (tipoGarantia && !TIPOS_GARANTIA_VALIDOS.includes(tipoGarantia)) {
      return NextResponse.json(
        { error: "Tipo de garantia inválido" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("contratos")
      .select(`
        id,
        codigo,
        data_inicio,
        data_fim,
        tipo_garantia,
        dados_garantia,
        proprietario_id,
        inquilino_id,
        imovel_id
      `)
      .eq("tipo", "locacao");

    // 🎯 filtro de garantia (tratando NULL corretamente)
    if (tipoGarantia === "sem_garantias") {
      query = query.is("tipo_garantia", null);
    } else {
      query = query.not("tipo_garantia", "is", null);

      if (tipoGarantia) {
        query = query.ilike("tipo_garantia", tipoGarantia);
      }
    }

    if (contratoCodigo) {
      query = query.eq("codigo", Number(contratoCodigo));
    }

    if (dataInicio) {
      query = query.gte("data_inicio", dataInicio);
    }

    if (dataFim) {
      query = query.lte("data_fim", dataFim);
    }

    const { data: contratos, error } = await query.order("data_inicio", {
      ascending: false,
    });

    if (error) throw error;

    if (!contratos || contratos.length === 0) {
      return NextResponse.json({ data: [] });
    }

    /* ================================
       BUSCAS AUXILIARES
    ================================ */
    const proprietariosIds = [...new Set(contratos.map(c => c.proprietario_id))];
    const inquilinosIds = [...new Set(contratos.map(c => c.inquilino_id))];
    const imoveisIds = [...new Set(contratos.map(c => c.imovel_id))];

    const [
      { data: proprietarios, error: errProp },
      { data: inquilinos, error: errInq },
      { data: imoveis, error: errImo },
    ] = await Promise.all([
      supabase.from("personas").select("id, nome").in("id", proprietariosIds),
      supabase.from("personas").select("id, nome").in("id", inquilinosIds),
      supabase
        .from("imoveis")
        .select("id, codigo_ref, titulo")
        .in("id", imoveisIds),
    ]);

    if (errProp) throw errProp;
    if (errInq) throw errInq;
    if (errImo) throw errImo;

    /* ================================
       MAPAS
    ================================ */
    const proprietariosMap = Object.fromEntries(
      proprietarios.map(p => [p.id, p.nome])
    );

    const inquilinosMap = Object.fromEntries(
      inquilinos.map(i => [i.id, i.nome])
    );

    const imoveisMap = Object.fromEntries(
      imoveis.map(i => [i.id, `${i.codigo_ref} — ${i.titulo}`])
    );

    /* ================================
       FILTRO POR NOME (em memória)
    ================================ */
    let resultado = contratos;

    if (locador) {
      const search = locador.toLowerCase();
      resultado = resultado.filter(c =>
        (proprietariosMap[c.proprietario_id] || "")
          .toLowerCase()
          .includes(search)
      );
    }

    if (locatario) {
      const search = locatario.toLowerCase();
      resultado = resultado.filter(c =>
        (inquilinosMap[c.inquilino_id] || "")
          .toLowerCase()
          .includes(search)
      );
    }

    /* ================================
       FORMATAÇÃO FINAL
    ================================ */
    const formatted = resultado.map(c => ({
      id: c.id,
      contrato: {
        codigo: c.codigo,
        locador: proprietariosMap[c.proprietario_id] || "-",
        locatario: inquilinosMap[c.inquilino_id] || "-",
        imovel: imoveisMap[c.imovel_id] || "-",
      },
      data_inicio: c.data_inicio,
      data_fim: c.data_fim,
      garantia: {
        tipo: c.tipo_garantia,
        dados: c.dados_garantia,
      },
    }));

    return NextResponse.json({ data: formatted });
  } catch (err) {
    console.error("Erro garantias locatícias:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
