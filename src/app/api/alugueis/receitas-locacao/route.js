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

    const categoria = searchParams.get("categoria");
    const controleConta =
      searchParams.get("controleConta") || searchParams.get("controle_conta");

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

    /* =========================================
       1) BUSCA TRANSAÇÕES DE LOCAÇÃO QUE
          PERTENCEM AO ALUGUEL (PAI OU FILHOS)
          
          REGRA:
          - pai: tipo = receita_aluguel (aluguel_base_id geralmente null)
          - filhos: aluguel_base_id preenchido (qualquer tipo)
    ========================================= */
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
        contratos (
          id,
          codigo,
          proprietario_id,
          inquilino_id,
          tipo,
          valor_acordado,
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
      // ✅ só contrato de locação
      .eq("contratos.tipo", "locacao")
      // ✅ pega entradas E saídas (pra desconto/abatimento aparecer)
      .in("natureza", ["entrada", "saida"])
      // ✅ só transações que fazem parte do aluguel:
      //    - ou é o próprio aluguel base
      //    - ou é um lançamento vinculado (filho)
      .or("tipo.eq.receita_aluguel,aluguel_base_id.not.is.null")
      .order("data_vencimento", { ascending: true });

    // filtros
    if (contratoId) transacoesQuery = transacoesQuery.eq("contrato_id", contratoId);

    // período
    if (periodoInicio) transacoesQuery = transacoesQuery.gte(campoData, periodoInicio);
    if (periodoFim) transacoesQuery = transacoesQuery.lte(campoData, periodoFim);

    // status baixa
    if (statusBaixa === "baixadas") {
      transacoesQuery = transacoesQuery.eq("status", "pago");
    }

    if (statusBaixa === "nao_baixadas") {
      transacoesQuery = transacoesQuery.in("status", ["pendente", "atrasado"]);
    }

    // filtros extras texto (mantive os seus)
    if (categoria) transacoesQuery = transacoesQuery.ilike("descricao", `%${categoria}%`);
    if (controleConta)
      transacoesQuery = transacoesQuery.ilike("descricao", `%${controleConta}%`);

    const { data: transacoes, error: transacoesError } = await transacoesQuery;
    if (transacoesError) throw transacoesError;

    const lista = transacoes || [];

    /* =========================================
       2) BUSCA LOCADOR/LOCATÁRIO (PERSONAS)
    ========================================= */
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

    /* =========================================
       3) FILTRO LOCADOR/LOCATÁRIO (TEXTO)
    ========================================= */
    const matchText = (valor, filtro) => {
      if (!filtro) return true;
      if (!valor) return false;
      return String(valor).toLowerCase().includes(String(filtro).toLowerCase());
    };

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

    /* =========================================
       4) AGRUPA PELO "aluguel_base_id"
       
       REGRA DO GRUPO:
       - se é filho: grupoId = aluguel_base_id
       - se é aluguel base: grupoId = id do próprio aluguel
    ========================================= */
    const gruposMap = new Map();

    for (const t of filtrada) {
      const grupoId = t.aluguel_base_id || t.id;

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

        gruposMap.set(grupoId, {
          aluguelBase: {
            id: grupoId,
            dataVencimento: t.data_vencimento || null,
            dataPagamento: t.data_pagamento || null,
            baixado: t.status === "pago",
          },
          contrato: {
            id: contrato?.id,
            codigo: contrato?.codigo,
            locadorNome: locadorObj?.nome || "-",
            locatarioNome: locatarioObj?.nome || "-",
            imovelResumo,
          },
          itens: [],
          resumo: {
            total: 0,
          },
        });
      }

      const grupo = gruposMap.get(grupoId);

      grupo.itens.push({
        id: t.id,
        tipo: t.tipo,
        natureza: t.natureza, // ✅ agora vai pro front
        descricao: t.descricao || t.tipo,
        valor: Number(t.valor || 0),
      });

      // ✅ data mais útil pro grupo (se tiver pagamento, prioriza)
      const dataPag = t.data_pagamento || null;
      const dataVen = t.data_vencimento || null;

      if (dataPag) grupo.aluguelBase.dataPagamento = dataPag;
      if (!grupo.aluguelBase.dataVencimento && dataVen)
        grupo.aluguelBase.dataVencimento = dataVen;
    }

    /* =========================================
       5) CALCULA TOTAL DO GRUPO
       - entrada soma
       - saída subtrai
    ========================================= */
    const agrupado = Array.from(gruposMap.values()).map((g) => {
      const total = (g.itens || []).reduce((sum, it) => {
        const valor = Number(it.valor || 0);
        if (it.natureza === "saida") return sum - valor;
        return sum + valor;
      }, 0);

      return {
        ...g,
        resumo: {
          total,
        },
      };
    });

    // ✅ ordena por data do grupo
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
