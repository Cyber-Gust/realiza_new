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

      const { data: transacoes, error: transError } = await supabase
        .from("transacoes")
        .select("contrato_id, status")
        .in("contrato_id", contratosIds);

      if (transError) throw transError;

      const financeiroMap = {};
      (transacoes || []).forEach((t) => {
        if (!financeiroMap[t.contrato_id]) financeiroMap[t.contrato_id] = [];
        financeiroMap[t.contrato_id].push(t.status);
      });

      const enriched = (contratos || []).map((c) => {
        const statuses = financeiroMap[c.id] || [];
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
      const { data, error } = await supabase
        .from("transacoes")
        .select(`
          id,
          valor,
          status,
          data_vencimento,
          contratos (
            id,
            imoveis (
              titulo
            ),
            inquilino:personas!contratos_inquilino_fk (
              nome,
              telefone
            )
          )
        `)
        .in("status", ["pendente", "atrasado"])
        .order("data_vencimento", { ascending: true })
        .order("valor", { ascending: false });

      if (error) throw error;

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
        .select(`
          id,
          codigo,
          taxa_administracao_percent
        `)
        .eq("id", contratoId)
        .single();

      if (contratoError) throw contratoError;

      const taxaAdmPercent = Number(contrato?.taxa_administracao_percent || 0);

      // transacoes do contrato
      const { data: transacoes, error: transacoesError } = await supabase
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
          data_pagamento
        `)
        .eq("contrato_id", contratoId)
        .eq("modulo_financeiro", "ALUGUEL")
        .order("data_vencimento", { ascending: true });

      if (transacoesError) throw transacoesError;

      const CREDITOS = ["receita_aluguel", "multa", "juros", "taxa_contrato"];
      const DEBITOS = ["repasse_proprietario", "taxa_adm_imobiliaria"];

      const timeline = (transacoes || []).map((t) => {
        const isCredito = CREDITOS.includes(t.tipo);
        const isDebito = DEBITOS.includes(t.tipo);

        return {
          ...t,
          movimento: isCredito ? "credito" : isDebito ? "debito" : "neutro",
        };
      });

      // taxa ADM automática em cima do aluguel
      const taxasAuto = [];

      for (const t of transacoes || []) {
        if (t.tipo !== "receita_aluguel") continue;

        const valorAluguel = Number(t.valor || 0);
        const valorTaxa = (valorAluguel * taxaAdmPercent) / 100;

        if (valorTaxa <= 0) continue;

        taxasAuto.push({
          id: `taxa-auto-${t.id}`,
          contrato_id: contratoId,
          tipo: "taxa_adm_imobiliaria",
          natureza: t.natureza, // segura pra não estourar enum
          status: t.status,
          descricao: `Taxa Administração (${taxaAdmPercent}%)`,
          valor: valorTaxa,
          data_vencimento: t.data_vencimento,
          data_pagamento: t.data_pagamento,
          movimento: "debito",
          automatico: true,
        });
      }

      const timelineFinal = [...timeline, ...taxasAuto].sort((a, b) => {
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
