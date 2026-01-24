import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req) {
  const supabase = createServiceClient();

  try {
    const { searchParams } = new URL(req.url);

    const view = searchParams.get("view") || "carteira";
    const contratoId = searchParams.get("contrato_id");
    const inquilinoId = searchParams.get("inquilino_id");

    const hoje = new Date().toISOString().split("T")[0];

    /* ===========================================================
       📌 1. CARTEIRA ATIVA
       view=carteira
    =========================================================== */
    if (view === "carteira") {
      const { data: contratos, error } = await supabase
        .from("contratos")
        .select(`
          id,
          data_inicio,
          data_fim,
          dia_vencimento_aluguel,
          valor_acordado,
          status,
          imoveis (
            id,
            titulo,
            endereco_cidade,
            endereco_estado
          ),
          inquilino:personas!contratos_inquilino_fk (
            id,
            nome,
            telefone
          )
        `)
        .eq("tipo", "locacao")
        .eq("status", "vigente");

      if (error) throw error;

      const contratosIds = (contratos || []).map((c) => c.id);

      if (!contratosIds.length) {
        return NextResponse.json({ data: [] });
      }
      const now = new Date();

      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const startISO = startMonth.toISOString().split("T")[0];
      const endISO = endMonth.toISOString().split("T")[0];

      const { data: transacoes, error: transError } = await supabase
      .from("transacoes")
      .select("contrato_id, status, data_vencimento")
      .in("contrato_id", contratosIds)
      .eq("modulo_financeiro", "ALUGUEL")
      .gte("data_vencimento", startISO)
      .lt("data_vencimento", endISO);

      if (transError) throw transError;

      const financeiroMap = {};
      (transacoes || []).forEach((t) => {
        if (!financeiroMap[t.contrato_id]) financeiroMap[t.contrato_id] = [];
        financeiroMap[t.contrato_id].push(t.status);
      });

      const enriched = (contratos || []).map((c) => {
        const statuses = financeiroMap[c.id] || [];

        if (statuses.length === 0) {
          return { ...c, status_financeiro: "pendente" };
        }

        const status_financeiro =
          statuses.includes("atrasado")
            ? "atrasado"
            : statuses.includes("pendente")
            ? "pendente"
            : "regular";

        return { ...c, status_financeiro };
      });

      return NextResponse.json({ data: enriched });
    }

    /* ===========================================================
       📌 2. INADIMPLÊNCIA
       view=inadimplencia
    =========================================================== */
    if (view === "inadimplencia") {
    const now = new Date();

    const hojeISO = now.toISOString().split("T")[0];

    // início do mês atual
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const startISO = startMonth.toISOString().split("T")[0];
    const endISO = endMonth.toISOString().split("T")[0];

    // 1) atrasados (qualquer vencimento <= hoje)
    const { data: atrasados, error: errAtrasados } = await supabase
      .from("transacoes")
      .select(`
        id,
        valor,
        status,
        data_vencimento,
        contratos (
          id,
          imoveis ( codigo_ref ),
          inquilino:personas!contratos_inquilino_fk ( nome, telefone )
        )
      `)
      .eq("status", "atrasado")
      .lte("data_vencimento", hojeISO);

    if (errAtrasados) throw errAtrasados;

    // 2) pendentes SOMENTE do mês atual
    const { data: pendentesMes, error: errPendentes } = await supabase
      .from("transacoes")
      .select(`
        id,
        valor,
        status,
        data_vencimento,
        contratos (
          id,
          imoveis ( codigo_ref ),
          inquilino:personas!contratos_inquilino_fk ( nome, telefone )
        )
      `)
      .eq("status", "pendente")
      .gte("data_vencimento", startISO)
      .lt("data_vencimento", endISO);

    if (errPendentes) throw errPendentes;

    const data = [...(atrasados || []), ...(pendentesMes || [])].sort(
      (a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento)
    );

    return NextResponse.json({ data });
  }

    /* ===========================================================
       📌 3. ALERTAS
       view=alertas
    =========================================================== */
    if (view === "alertas") {
      const limite = new Date();
      limite.setDate(limite.getDate() + 90);
      const limiteISO = limite.toISOString().split("T")[0];

      const [contratosVencendo, reajustes, osPendentes, vistorias] =
        await Promise.all([
          supabase
            .from("contratos")
            .select("id, data_fim, imoveis(titulo)")
            .eq("status", "vigente")
            .gte("data_fim", hoje)
            .lte("data_fim", limiteISO),

          supabase
            .from("contratos")
            .select("id, indice_reajuste, imoveis(titulo)")
            .eq("status", "reajuste_pendente"),

          supabase
            .from("ordens_servico")
            .select("id, status, imoveis(titulo)")
            .not("status", "in", "(concluida,cancelada)"),

          supabase
            .from("vistorias")
            .select("id, tipo, data_vistoria, imoveis(titulo)")
            .eq("status", "pendente"),
        ]);

      return NextResponse.json({
        data: {
          contratos_vencendo: contratosVencendo.data || [],
          reajustes_proximos: reajustes.data || [],
          os_pendentes: osPendentes.data || [],
          vistorias_programadas: vistorias.data || [],
        },
      });
    }

    /* ===========================================================
       📌 4. RENOVAÇÃO / RESCISÃO
       view=renovacao | view=rescisao
    =========================================================== */
    if (view === "renovacao" || view === "rescisao") {
      if (!contratoId) {
        return NextResponse.json(
          { error: "contrato_id é obrigatório" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("contratos")
        .select(`
          *,
          imoveis (
            titulo,
            endereco_cidade,
            endereco_estado
          ),
          inquilino:personas!contratos_inquilino_id_fkey (
            nome,
            cpf_cnpj,
            telefone
          ),
          proprietario:personas!contratos_proprietario_id_fkey (
            nome
          )
        `)
        .eq("id", contratoId)
        .single();

      if (error) throw error;

      return NextResponse.json({ data });
    }

    /* ===========================================================
       ✅ 5. INQUILINOS COM CONTRATO VIGENTE
       view=inquilinos_vigentes
    =========================================================== */
    if (view === "inquilinos_vigentes") {
      const { data, error } = await supabase
        .from("contratos")
        .select(`
          inquilino:personas!contratos_inquilino_fk (
            id,
            nome,
            tipo,
            ativo
          )
        `)
        .eq("tipo", "locacao")
        .eq("status", "vigente");

      if (error) throw error;

      // remove duplicados
      const map = new Map();
      (data || []).forEach((row) => {
        if (row?.inquilino?.id) {
          map.set(row.inquilino.id, row.inquilino);
        }
      });

      return NextResponse.json({ data: Array.from(map.values()) });
    }

    /* ===========================================================
       ✅ 6. CONTRATOS POR INQUILINO (SÓ VIGENTES)
       view=contratos_por_inquilino&inquilino_id=...
    =========================================================== */
    if (view === "contratos_por_inquilino") {
      if (!inquilinoId) {
        return NextResponse.json(
          { error: "inquilino_id é obrigatório" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("contratos")
        .select(`
          id,
          codigo,
          status,
          data_inicio,
          data_fim,
          taxa_administracao_percent,
          imoveis (
            id,
            titulo
          )
        `)
        .eq("inquilino_id", inquilinoId)
        .eq("tipo", "locacao")
        .eq("status", "vigente")
        .order("codigo", { ascending: false });

      if (error) {
        console.log("ERRO contratos_por_inquilino:", error);
        throw error;
      }

      return NextResponse.json({ data: data || [] });
    }

    /* ===========================================================
      ✅ 8. DETALHES DO CONTRATO (DRAWER)
      view=detalhes_contrato&contrato_id=...
    =========================================================== */
    if (view === "detalhes_contrato") {
      if (!contratoId) {
        return NextResponse.json(
          { error: "contrato_id é obrigatório" },
          { status: 400 }
        );
      }

      // 1) Busca contrato (sem join nenhum)
      const { data: contrato, error: contratoError } = await supabase
      .from("contratos")
      .select(`
        id,
        codigo,
        tipo,
        status,
        imovel_id,
        proprietario_id,
        inquilino_id,
        data_inicio,
        data_fim,
        valor_acordado,
        taxa_administracao_percent,
        dia_vencimento_aluguel,

        indice_reajuste,
        tipo_garantia,
        dados_garantia,
        tipo_renovacao,
        locatario_pj,

        ultimo_reajuste_em,
        valor_reajustado,
        renovado_em,
        created_at,
        updated_at
      `)
      .eq("id", contratoId)
      .single();

      if (contratoError) throw contratoError;

      // 2) Busca imóvel
      const { data: imovel, error: imovelError } = await supabase
        .from("imoveis")
        .select(`
          id,
          codigo_ref,
          titulo,
          endereco_cidade,
          endereco_estado
        `)
        .eq("id", contrato.imovel_id)
        .single();

      if (imovelError) throw imovelError;

      // 3) Busca inquilino
      const { data: inquilino, error: inquilinoError } = await supabase
        .from("personas")
        .select(`
          id,
          nome,
          telefone,
          cpf_cnpj
        `)
        .eq("id", contrato.inquilino_id)
        .single();

      if (inquilinoError) throw inquilinoError;

      // 4) Busca proprietário
      const { data: proprietario, error: proprietarioError } = await supabase
        .from("personas")
        .select(`
          id,
          nome
        `)
        .eq("id", contrato.proprietario_id)
        .single();

      if (proprietarioError) throw proprietarioError;

      // 5) Monta resposta final no formato que o Drawer quer
      return NextResponse.json({
        data: {
          ...contrato,
          imoveis: imovel,
          inquilino,
          proprietario,
        },
      });
    }

    /* ===========================================================
      ✅ 7. TIMELINE LOCADOR
      view=timeline_locador&contrato_id=...
    =========================================================== */
    if (view === "timeline_locador") {
      if (!contratoId) {
        return NextResponse.json(
          { error: "contrato_id é obrigatório" },
          { status: 400 }
        );
      }

      // contrato (pegar taxa adm)
      const { data: contrato, error: contratoError } = await supabase
        .from("contratos")
        .select(
          `
            id,
            codigo,
            taxa_administracao_percent
          `
        )
        .eq("id", contratoId)
        .single();

      if (contratoError) throw contratoError;

      const taxaAdmPercent = Number(contrato?.taxa_administracao_percent || 0);

      // transacoes do contrato
      const { data: transacoes, error: transacoesError } = await supabase
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
            dados_cobranca_json,
            aluguel_base_id
          `
        )
        .eq("contrato_id", contratoId)
        .eq("modulo_financeiro", "ALUGUEL")
        .order("data_vencimento", { ascending: true });

      if (transacoesError) throw transacoesError;

      /**
       * ✅ REGRA DA TIMELINE (extrato de conta corrente):
       * - natureza === "entrada" => crédito
       * - natureza === "saida" => débito
       * - qualquer outro valor => neutro (não entra no extrato)
       */
      const timeline = (transacoes || []).map((t) => {
        const movimento =
          t.natureza === "entrada"
            ? "credito"
            : t.natureza === "saida"
            ? "debito"
            : "neutro";

        return {
          ...t,
          movimento,
          valor: Number(t.valor || 0),
        };
      });

      

      const timelineFinal = [...timeline]
        // ✅ só deixa o que é extrato real
        .filter((t) => t.movimento === "credito" || t.movimento === "debito")
        // ✅ ordena por vencimento (o front ainda ordena por pagamento se quiser)
        .sort((a, b) => {
          return (
            new Date(a.data_vencimento).getTime() -
            new Date(b.data_vencimento).getTime()
          );
        });

      return NextResponse.json({
        data: timelineFinal,
        contrato: {
          id: contrato.id,
          codigo: contrato.codigo,
          taxa_administracao_percent: taxaAdmPercent,
        },
      });
    }

    return NextResponse.json({ error: "View inválida" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
