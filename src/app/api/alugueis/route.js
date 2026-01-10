import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const view = searchParams.get("view") || "carteira";
  const contratoId = searchParams.get("contrato_id");

  try {
    /* ===========================================================
       📌 1. CARTEIRA ATIVA
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

      const contratosIds = contratos.map(c => c.id);

      const { data: transacoes, error: transError } = await supabase
        .from("transacoes")
        .select("contrato_id, status")
        .in("contrato_id", contratosIds);

      if (transError) throw transError;

      const financeiroMap = {};
      transacoes.forEach(t => {
        if (!financeiroMap[t.contrato_id]) {
          financeiroMap[t.contrato_id] = [];
        }
        financeiroMap[t.contrato_id].push(t.status);
      });

      const enriched = contratos.map(c => {
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
    =========================================================== */
    if (view === "alertas") {
      const hoje = new Date().toISOString().split("T")[0];
      const limite = new Date();
      limite.setDate(limite.getDate() + 90);
      const limiteISO = limite.toISOString().split("T")[0];

      const [
        contratosVencendo,
        reajustes,
        osPendentes,
        vistorias
      ] = await Promise.all([
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
          .eq("status", "pendente")
      ]);

      return NextResponse.json({
        data: {
          contratos_vencendo: contratosVencendo.data || [],
          reajustes_proximos: reajustes.data || [],
          os_pendentes: osPendentes.data || [],
          vistorias_programadas: vistorias.data || []
        }
      });
    }

    /* ===========================================================
       📌 4. RENOVAÇÃO / RESCISÃO
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
       📌 5. TIMELINE
    =========================================================== */
    if (view === "timeline") {
      if (!contratoId) {
        return NextResponse.json(
          { error: "contrato_id é obrigatório" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("transacoes")
        .select(`
          id,
          tipo,
          status,
          descricao,
          valor,
          data_vencimento,
          data_pagamento
        `)
        .eq("contrato_id", contratoId)
        .order("data_vencimento", { ascending: true });

      if (error) throw error;

      return NextResponse.json({ data });
    }

    return NextResponse.json(
      { error: "View inválida" },
      { status: 400 }
    );

  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
