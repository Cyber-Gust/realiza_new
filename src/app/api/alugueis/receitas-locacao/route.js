import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  try {
    // ============================
    // 🔎 Params
    // ============================
    const contratoId =
      searchParams.get("contratoId") || searchParams.get("contrato_id");

    const periodoInicio =
      searchParams.get("periodoInicio") || searchParams.get("periodo_inicio");

    const periodoFim =
      searchParams.get("periodoFim") || searchParams.get("periodo_fim");

    const tipoTaxa =
      searchParams.get("tipoTaxa") || searchParams.get("tipo_taxa");

    const controleConta =
      searchParams.get("controleConta") || searchParams.get("controle_conta");

    const categoria = searchParams.get("categoria");
    const locador = searchParams.get("locador");
    const locatario = searchParams.get("locatario");

    const considerarDataDe = searchParams.get("considerarDataDe") || "pagamento";
    const statusBaixa = searchParams.get("statusBaixa") || "baixadas";

    // ============================
    // 📌 Campo usado no filtro do período
    // ============================
    let campoData = "data_pagamento";
    if (considerarDataDe === "vencimento") campoData = "data_vencimento";
    if (considerarDataDe === "pagamento") campoData = "data_pagamento";

    // ============================
    // ✅ Tipos válidos no schema
    // ============================
    const TIPOS_ENTRADA_LOCACAO = [
      "receita_aluguel",
      "multa",
      "juros",
      "correcao_monetaria",
      "taxa_contrato",
    ];

    const TIPO_REPASSE = "repasse_proprietario";

    // ============================
    // ✅ Query ENTRADAS
    // ============================
    let entradasQuery = supabase
      .from("transacoes")
      .select(
        `
        id,
        contrato_id,
        tipo,
        natureza,
        status,
        descricao,
        valor,
        data_vencimento,
        data_pagamento,
        contratos (
          id,
          codigo,
          proprietario_id,
          inquilino_id,
          tipo,
          valor_acordado,
          taxa_administracao_percent,
          imoveis (
            id,
            titulo,
            endereco_logradouro,
            endereco_numero,
            endereco_bairro,
            endereco_cidade,
            endereco_estado,
            endereco_cep
          )
        )
      `
      )
      .eq("contratos.tipo", "locacao")
      .eq("natureza", "entrada")
      .in("tipo", TIPOS_ENTRADA_LOCACAO)
      .order("data_vencimento", { ascending: true });

    // filtros
    if (contratoId) entradasQuery = entradasQuery.eq("contrato_id", contratoId);

    // ✅ filtro tipoTaxa
    if (tipoTaxa) entradasQuery = entradasQuery.eq("tipo", tipoTaxa);

    // período
    if (considerarDataDe !== "repasse") {
      if (periodoInicio) entradasQuery = entradasQuery.gte(campoData, periodoInicio);
      if (periodoFim) entradasQuery = entradasQuery.lte(campoData, periodoFim);
    } else {
      if (periodoInicio) entradasQuery = entradasQuery.gte("data_vencimento", periodoInicio);
      if (periodoFim) entradasQuery = entradasQuery.lte("data_vencimento", periodoFim);
    }

    // status baixa
    if (statusBaixa === "baixadas") {
      entradasQuery = entradasQuery.eq("status", "pago");
    }
    if (statusBaixa === "nao_baixadas") {
      entradasQuery = entradasQuery.in("status", ["pendente", "atrasado"]);
    }

    // filtros extras
    if (categoria) entradasQuery = entradasQuery.ilike("descricao", `%${categoria}%`);
    if (controleConta) entradasQuery = entradasQuery.ilike("descricao", `%${controleConta}%`);

    const { data: entradas, error: entradasError } = await entradasQuery;
    if (entradasError) throw entradasError;

    const listaEntradas = entradas || [];

    // ============================
    // ✅ Query REPASSES (saída)
    // ============================
    let repassesQuery = supabase
      .from("transacoes")
      .select(
        `
        id,
        contrato_id,
        tipo,
        natureza,
        status,
        valor,
        descricao,
        data_vencimento,
        data_pagamento
      `
      )
      .eq("natureza", "saida")
      .eq("tipo", TIPO_REPASSE);

    if (contratoId) repassesQuery = repassesQuery.eq("contrato_id", contratoId);

    if (considerarDataDe === "repasse") {
      if (periodoInicio) repassesQuery = repassesQuery.gte("data_pagamento", periodoInicio);
      if (periodoFim) repassesQuery = repassesQuery.lte("data_pagamento", periodoFim);

      if (statusBaixa === "baixadas") {
        repassesQuery = repassesQuery.eq("status", "pago");
      }
      if (statusBaixa === "nao_baixadas") {
        repassesQuery = repassesQuery.in("status", ["pendente", "atrasado"]);
      }
    }

    const { data: repasses, error: repassesError } = await repassesQuery;
    if (repassesError) throw repassesError;

    const listaRepasses = repasses || [];

    // ============================
    // ✅ Busca locador/locatário (personas)
    // ============================
    const idsPessoa = new Set();

    listaEntradas.forEach((t) => {
      const c = t?.contratos;
      if (c?.proprietario_id) idsPessoa.add(c.proprietario_id);
      if (c?.inquilino_id) idsPessoa.add(c.inquilino_id);
    });

    const ids = Array.from(idsPessoa);

    let pessoasMap = {};
    if (ids.length > 0) {
      const { data: pessoas, error: pessoasError } = await supabase
        .from("personas")
        .select("id, nome, cpf_cnpj, telefone")
        .in("id", ids);

      if (pessoasError) throw pessoasError;

      pessoasMap = (pessoas || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
    }

    // ============================
    // ✅ Filtra locador / locatario (texto)
    // ============================
    const matchText = (valor, filtro) => {
      if (!filtro) return true;
      if (!valor) return false;
      return String(valor).toLowerCase().includes(String(filtro).toLowerCase());
    };

    const filtrada = listaEntradas.filter((t) => {
      const contrato = t?.contratos;

      const locadorObj = contrato?.proprietario_id
        ? pessoasMap[contrato.proprietario_id]
        : null;

      const locatarioObj = contrato?.inquilino_id
        ? pessoasMap[contrato.inquilino_id]
        : null;

      const passaLocador =
        !locador ||
        matchText(locadorObj?.nome, locador) ||
        matchText(locadorObj?.cpf_cnpj, locador) ||
        matchText(locadorObj?.telefone, locador);

      const passaLocatario =
        !locatario ||
        matchText(locatarioObj?.nome, locatario) ||
        matchText(locatarioObj?.cpf_cnpj, locatario) ||
        matchText(locatarioObj?.telefone, locatario);

      return passaLocador && passaLocatario;
    });

    // ============================
    // ✅ Index repasses por contrato (mais recente)
    // ============================
    const repasseMap = new Map();

    listaRepasses.forEach((r) => {
      if (!r.contrato_id) return;

      const dataRef = r.data_pagamento || r.data_vencimento || null;
      const ts = dataRef ? new Date(dataRef).getTime() : 0;

      const atual = repasseMap.get(r.contrato_id);
      const atualTs = atual?.dataRefTs || 0;

      if (!atual || ts > atualTs) {
        repasseMap.set(r.contrato_id, {
          dataRepasse: r.data_pagamento || null,
          repasseBaixado: r.status === "pago",
          dataRefTs: ts,
        });
      }
    });

    // ============================
    // ✅ Map aluguel por contrato + vencimento
    // ============================
    const mapAluguel = new Map();

    filtrada.forEach((t) => {
      if (t.tipo !== "receita_aluguel") return;

      const key = `${t.contrato_id}__${t.data_vencimento || "sem_venc"}`;
      mapAluguel.set(key, Number(t.valor || 0));
    });

    // ============================
    // ✅ Helpers descrição automática
    // ============================
    const formatPercent = (n) => {
      const num = Number(n || 0);
      return `${num.toFixed(2)}%`;
    };

    const getLabelReceita = (tipo) => {
      const map = {
        receita_aluguel: "Taxa Administrativa",
        multa: "Multa",
        juros: "Juros",
        correcao_monetaria: "Correção Monetária",
        taxa_contrato: "Taxa de Contrato",
      };
      return map[tipo] || tipo;
    };

    // ============================
    // ✅ Normaliza pro front
    // ============================
    const normalized = filtrada.map((t) => {
      const contrato = t?.contratos;
      const imovel = contrato?.imoveis;

      const locadorObj = contrato?.proprietario_id
        ? pessoasMap[contrato.proprietario_id]
        : null;

      const locatarioObj = contrato?.inquilino_id
        ? pessoasMap[contrato.inquilino_id]
        : null;

      const imovelResumo = imovel
        ? [
            imovel.titulo,
            imovel.endereco_logradouro
              ? `${imovel.endereco_logradouro}, ${imovel.endereco_numero || "s/n"}`
              : null,
            imovel.endereco_bairro,
            imovel.endereco_cidade
              ? `${imovel.endereco_cidade} - ${imovel.endereco_estado || ""}`
              : null,
            imovel.endereco_cep,
          ]
            .filter(Boolean)
            .join(" | ")
        : "-";

      const rep = repasseMap.get(t.contrato_id);

      const valorOriginal = Number(t.valor || 0);

      // aluguel base pra % (mesmo contrato + mesmo vencimento)
      const aluguelBase = Number(contrato?.valor_acordado || 0);

      // % padrão (multa/juros/etc)
      const percentCalculado =
        aluguelBase > 0 ? (valorOriginal / aluguelBase) * 100 : 0;

      // % da taxa adm vem do contrato
      const percentContrato = Number(contrato?.taxa_administracao_percent || 0);

      let valorExibido = valorOriginal;
      let valorImobiliaria = valorOriginal;
      let descricaoAuto = "";

      // ✅ receita_aluguel: não exibe aluguel cheio, exibe taxa adm calculada
      if (t.tipo === "receita_aluguel") {
        const taxaAdmCalculada =
          percentContrato > 0 ? aluguelBase * (percentContrato / 100) : 0;

        valorExibido = taxaAdmCalculada;
        valorImobiliaria = taxaAdmCalculada;

        descricaoAuto = `${getLabelReceita(t.tipo)} (${formatPercent(
          percentContrato
        )})`;
      } else {
        // ✅ multa/juros/correção/taxa contrato: descrição vem do cálculo
        descricaoAuto = `${getLabelReceita(t.tipo)} (${formatPercent(
          percentCalculado
        )})`;
      }

      return {
        id: t.id,
        tipo: t.tipo,

        descricao: descricaoAuto,

        valor: valorExibido,
        valorImobiliaria,

        dataVencimento: t.data_vencimento,
        dataPagamento: t.data_pagamento,

        dataRepasse: rep?.dataRepasse || null,
        repasseBaixado: Boolean(rep?.repasseBaixado),

        baixado: t.status === "pago",

        contrato: {
          id: contrato?.id,
          codigo: contrato?.codigo,
          locadorNome: locadorObj?.nome || "-",
          locatarioNome: locatarioObj?.nome || "-",
          imovelResumo,
        },
      };
    });

    normalized.sort((a, b) => {
      const da = a.dataVencimento ? new Date(a.dataVencimento).getTime() : 0;
      const db = b.dataVencimento ? new Date(b.dataVencimento).getTime() : 0;
      return da - db;
    });

    return NextResponse.json({ data: normalized });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
