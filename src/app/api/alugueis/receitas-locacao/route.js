import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/* ======================================================
   HELPERS
====================================================== */

function getCompetenciaYYYYMM(t) {
  // prioridade: dados_cobranca_json.competencia
  const raw = t?.dados_cobranca_json;

  if (raw && typeof raw === "object") {
    const comp = raw?.competencia;
    if (comp && /^\d{4}-\d{2}$/.test(comp)) return comp;
  }

  // fallback: usa data_vencimento
  if (t?.data_vencimento) return String(t.data_vencimento).slice(0, 7);

  return null;
}

function matchText(valor, filtro) {
  if (!filtro) return true;
  if (!valor) return false;
  return String(valor).toLowerCase().includes(String(filtro).toLowerCase());
}

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  try {
    /* ======================================================
       PARAMS
    ====================================================== */

    const TIPOS_RECEITA_IMOBILIARIA = new Set([
      "taxa_adm_imobiliaria",
      "multa",
      "juros",
      "correcao_monetaria",
      "taxa_contrato",
    ]);

    const contratoId =
      searchParams.get("contratoId") || searchParams.get("contrato_id");

    const periodoInicio =
      searchParams.get("periodoInicio") || searchParams.get("periodo_inicio");

    const periodoFim =
      searchParams.get("periodoFim") || searchParams.get("periodo_fim");

    const categoria = searchParams.get("categoria");
    const controleConta =
      searchParams.get("controleConta") || searchParams.get("controle_conta");

    const locador = searchParams.get("locador");
    const locatario = searchParams.get("locatario");

    const considerarDataDe = searchParams.get("considerarDataDe") || "pagamento";
    const statusBaixa = searchParams.get("statusBaixa") || "baixadas";

    /* ======================================================
       CAMPO DATA PARA FILTRO
    ====================================================== */
    let campoData = "data_pagamento";
    if (considerarDataDe === "vencimento") campoData = "data_vencimento";
    if (considerarDataDe === "pagamento") campoData = "data_pagamento";

    /* ======================================================
       1) BUSCA TRANSAÇÕES QUE IMPORTAM
       ✅ inclui taxa_adm_imobiliaria sem depender de aluguel_base_id
       ✅ inclui repasse_proprietario pra puxar a dataRepasse (por competência)
    ====================================================== */

    let transacoesQuery = supabase
      .from("transacoes")
      .select(
        `
        id,
        aluguel_base_id,
        contrato_id,
        tipo,
        natureza,
        status,
        descricao,
        valor,
        data_vencimento,
        data_pagamento,
        dados_cobranca_json,

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
      .in("natureza", ["entrada", "saida"])
      .or(
        [
          "tipo.eq.receita_aluguel",
          "aluguel_base_id.not.is.null",
          "tipo.eq.taxa_adm_imobiliaria",
          "tipo.eq.multa",
          "tipo.eq.juros",
          "tipo.eq.correcao_monetaria",
          "tipo.eq.taxa_contrato",
          "tipo.eq.repasse_proprietario",
        ].join(",")
      )
      .order("data_vencimento", { ascending: true });

    // filtro contrato
    if (contratoId) transacoesQuery = transacoesQuery.eq("contrato_id", contratoId);

    // período
    if (periodoInicio) transacoesQuery = transacoesQuery.gte(campoData, periodoInicio);
    if (periodoFim) transacoesQuery = transacoesQuery.lte(campoData, periodoFim);

    // trava até hoje (consistência do painel)
    const hoje = new Date().toISOString().split("T")[0];
    transacoesQuery = transacoesQuery.lte(campoData, hoje);

    // status baixa
    if (statusBaixa === "baixadas") {
      transacoesQuery = transacoesQuery.eq("status", "pago");
    }

    if (statusBaixa === "nao_baixadas") {
      transacoesQuery = transacoesQuery.in("status", ["pendente", "atrasado"]);
    }

    // filtros extras texto
    if (categoria) transacoesQuery = transacoesQuery.ilike("descricao", `%${categoria}%`);
    if (controleConta)
      transacoesQuery = transacoesQuery.ilike("descricao", `%${controleConta}%`);

    const { data: transacoes, error: transacoesError } = await transacoesQuery;
    if (transacoesError) throw transacoesError;

    const lista = transacoes || [];

    /* ======================================================
       2) BUSCA LOCADOR/LOCATÁRIO (PERSONAS)
    ====================================================== */

    const idsPessoa = new Set();

    lista.forEach((t) => {
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

    /* ======================================================
       3) FILTRO LOCADOR/LOCATÁRIO (no back)
       ✅ (continua aceitando nome/cpf/telefone)
    ====================================================== */

    const filtrada = lista.filter((t) => {
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

    /* ======================================================
       4) MAPA DE REPASSE POR COMPETÊNCIA
       ✅ repasse_proprietario NÃO entra como item
       ✅ mas preenche dataRepasse no grupo
       chave: contrato_id|competencia
    ====================================================== */

    const repasseMap = new Map();

    for (const t of filtrada) {
      if (t.tipo !== "repasse_proprietario") continue;

      const comp = getCompetenciaYYYYMM(t);
      if (!comp) continue;

      const key = `${t.contrato_id}|${comp}`;

      // guarda data pagamento do repasse
      const atual = repasseMap.get(key);
      const nova = t.data_pagamento || null;

      if (!atual) {
        repasseMap.set(key, nova);
      } else if (nova && new Date(nova) > new Date(atual)) {
        repasseMap.set(key, nova);
      }
    }

    /* ======================================================
       5) AGRUPAMENTO
       ✅ grupoId = aluguel_base_id OU id
       ✅ taxa adm agrupa por referencia_id (aluguel pai)
       ✅ dataRepasse gruda por competencia
    ====================================================== */

    const gruposMap = new Map();

    for (const t of filtrada) {
      // ✅ taxa adm tem que grudar no aluguel pai correto
      const referenciaId = t?.dados_cobranca_json?.referencia_id || null;

      const grupoId =
        t.tipo === "taxa_adm_imobiliaria" && referenciaId
          ? referenciaId
          : t.aluguel_base_id || t.id;

      if (!gruposMap.has(grupoId)) {
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

        // ✅ competência do grupo (pra repasse por competencia)
        const compGrupo = getCompetenciaYYYYMM(t);
        const repasseKey = compGrupo ? `${t.contrato_id}|${compGrupo}` : null;
        const dataRepasse = repasseKey ? repasseMap.get(repasseKey) || null : null;

        gruposMap.set(grupoId, {
          aluguelBase: {
            id: grupoId,
            dataVencimento: t.data_vencimento || null,
            dataPagamento: t.data_pagamento || null,

            // ✅ AQUI: a data de pagamento do repasse daquele mês
            dataRepasse,

            baixado: t.status === "pago",
          },
          contrato: {
            id: contrato?.id,
            codigo: contrato?.codigo,
            locadorNome: locadorObj?.nome || "-",
            locatarioNome: locatarioObj?.nome || "-",
            imovelResumo,
          },
          contratoRaw: contrato || null,
          itens: [],
          resumo: { total: 0 },
        });
      }

      const grupo = gruposMap.get(grupoId);

      const ehAluguelBase = t.tipo === "receita_aluguel";
      const ehReceitaImobiliaria = TIPOS_RECEITA_IMOBILIARIA.has(t.tipo);

      // ✅ repasse NUNCA entra como item (ele é operacional / saída)
      const ehRepasse = t.tipo === "repasse_proprietario";
      if (ehRepasse) {
        // mas pode atualizar a dataRepasse se vier melhor/mais recente
        const compGrupo = getCompetenciaYYYYMM(t);
        const repasseKey = compGrupo ? `${t.contrato_id}|${compGrupo}` : null;
        const dataRepasse = repasseKey ? repasseMap.get(repasseKey) || null : null;

        if (dataRepasse) grupo.aluguelBase.dataRepasse = dataRepasse;
        continue;
      }

      // ✅ só entra:
      // - aluguel base (pra datas e competência)
      // - OU receitas reais da imobiliária
      if (!ehAluguelBase && !ehReceitaImobiliaria) {
        continue;
      }

      grupo.itens.push({
        id: t.id,
        tipo: t.tipo,
        natureza: t.natureza,
        descricao: t.descricao || t.tipo,
        valor: Number(t.valor || 0),
        status: t.status,
      });

      // ✅ data mais útil pro grupo
      const dataPag = t.data_pagamento || null;
      const dataVen = t.data_vencimento || null;

      if (dataPag) grupo.aluguelBase.dataPagamento = dataPag;
      if (!grupo.aluguelBase.dataVencimento && dataVen) {
        grupo.aluguelBase.dataVencimento = dataVen;
      }
    }

    /* ======================================================
       6) CALCULA TOTAL DO GRUPO (somente itens da imobiliária + aluguel base)
       ✅ total respeita natureza
    ====================================================== */

    const agrupado = Array.from(gruposMap.values()).map((g) => {
      const total = (g.itens || []).reduce((sum, it) => {
        const valor = Number(it.valor || 0);
        if (it.natureza === "saida") return sum - valor;
        return sum + valor;
      }, 0);

      return {
        ...g,
        resumo: { total },
      };
    });

    /* ======================================================
       7) ORDENAÇÃO
    ====================================================== */

    agrupado.sort((a, b) => {
      const da =
        a.aluguelBase.dataPagamento ||
        a.aluguelBase.dataVencimento ||
        "1970-01-01";

      const db =
        b.aluguelBase.dataPagamento ||
        b.aluguelBase.dataVencimento ||
        "1970-01-01";

      return new Date(da).getTime() - new Date(db).getTime();
    });

    return NextResponse.json({ data: agrupado });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
