// /app/api/alugueis/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * ===========================================================
 *  🏢 MÓDULO DE ALUGUÉIS — ROTA ÚNICA
 *  view = carteira | timeline | inadimplencia | alertas | renovacao | rescisao
 * ===========================================================
 */

export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") || "carteira";
  const contratoId = searchParams.get("contrato_id");

  try {
    switch (view) {
      /* ===========================================================
         📌 1. CARTEIRA ATIVA
      =========================================================== */
      case "carteira": {
        const { data: contratos, error } = await supabase
          .from("contratos")
          .select(
            `
              id,
              imovel_id,
              proprietario_id,
              inquilino_id,
              data_inicio,
              data_fim,
              dia_vencimento_aluguel,
              valor_acordado,
              taxa_administracao_percent,
              status,
              imoveis ( id, titulo, endereco_cidade, endereco_estado ),
              proprietario:personas!contratos_proprietario_id_fkey ( id, nome, telefone ),
              inquilino:personas!contratos_inquilino_id_fkey ( id, nome, telefone )
            `
          )
          .eq("tipo", "locacao")
          .eq("status", "ativo");

        if (error) throw error;

        // 🔹 Calcular status financeiro atual (pago, pendente, atrasado)
        const contratosIds = contratos.map((c) => c.id);
        const { data: transacoes } = await supabase
          .from("transacoes")
          .select("id, contrato_id, tipo, status, data_vencimento")
          .in("contrato_id", contratosIds);

        const financeiroMap = {};
        transacoes?.forEach((t) => {
          const key = t.contrato_id;
          if (!financeiroMap[key]) financeiroMap[key] = [];
          financeiroMap[key].push(t);
        });

        const enriched = contratos.map((c) => {
          const t = financeiroMap[c.id] || [];
          const atraso = t.some((x) => x.status === "atrasado");
          const pendente = t.some((x) => x.status === "pendente");
          const status_financeiro = atraso
            ? "atrasado"
            : pendente
            ? "pendente"
            : "regular";

          return { ...c, status_financeiro };
        });

        return NextResponse.json({ data: enriched });
      }

      /* ===========================================================
         📌 2. TIMELINE FINANCEIRA DO CONTRATO
      =========================================================== */
      case "timeline": {
        if (!contratoId)
          return NextResponse.json(
            { error: "contrato_id é obrigatório" },
            { status: 400 }
          );

        const { data: transacoes, error } = await supabase
          .from("transacoes")
          .select(
            `
              id,
              tipo,
              status,
              valor,
              data_vencimento,
              data_pagamento,
              descricao
            `
          )
          .eq("contrato_id", contratoId)
          .order("data_vencimento", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ data: transacoes });
      }

      /* ===========================================================
         📌 3. INADIMPLÊNCIA
      =========================================================== */
      case "inadimplencia": {
        const { data, error } = await supabase
          .from("transacoes")
          .select(
            `
            id,
            contrato_id,
            valor,
            data_vencimento,
            status,
            contratos (
              id,
              valor_acordado,
              imoveis ( titulo ),
              inquilino:personas!contratos_inquilino_id_fkey ( nome, telefone )
            )
          `
          )
          .in("status", ["pendente", "atrasado"])
          .order("data_vencimento", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ data });
      }

      /* ===========================================================
         📌 4. ALERTAS (Contrato vencendo, reajustes, OS, vistorias)
      =========================================================== */
      case "alertas": {
        // 📌 Contratos prestes a vencer (90 dias)
        const hoje = new Date();
        const alertaData = new Date();
        alertaData.setDate(hoje.getDate() + 90);

        const { data: contratosVencendo } = await supabase
          .from("contratos")
          .select(`
            id,
            imovel_id,
            data_fim,
            status,
            imoveis ( titulo )
          `)
          .eq("tipo", "locacao")
          .eq("status", "ativo")
          .lt("data_fim", alertaData.toISOString().split("T")[0]);

        // 📌 Contratos com reajuste anual (aniversário)
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth() + 1;

        const { data: reajustes } = await supabase
          .from("contratos")
          .select(`
            id,
            data_inicio,
            indice_reajuste,
            imoveis ( titulo )
          `);

        const reajustesProximos = reajustes.filter((c) => {
          const dataInicio = new Date(c.data_inicio);
          return (
            dataInicio.getMonth() + 1 === mesAtual &&
            dataInicio.getFullYear() < anoAtual
          );
        });

        // 📌 OS abertas
        const { data: os } = await supabase
          .from("ordens_servico")
          .select(`
            id,
            status,
            imovel_id,
            imoveis ( titulo )
          `)
          .neq("status", "concluida");

        // 📌 Vistorias programadas
        const { data: vistorias } = await supabase
          .from("vistorias")
          .select(`
            id,
            tipo,
            data_vistoria,
            imovel_id,
            imoveis ( titulo )
          `);

        return NextResponse.json({
          data: {
            contratos_vencendo: contratosVencendo,
            reajustes_proximos: reajustesProximos,
            os_pendentes: os,
            vistorias_programadas: vistorias,
          },
        });
      }

      /* ===========================================================
         📌 5. RENOVAÇÃO (GET dados)
      =========================================================== */
      case "renovacao": {
        if (!contratoId)
          return NextResponse.json(
            { error: "contrato_id é obrigatório" },
            { status: 400 }
          );

        const { data: contrato, error } = await supabase
          .from("contratos")
          .select(
            `
            id,
            imovel_id,
            data_inicio,
            data_fim,
            valor_acordado,
            indice_reajuste,
            imoveis ( titulo )
          `
          )
          .eq("id", contratoId)
          .single();

        if (error) throw error;

        return NextResponse.json({
          data: contrato,
        });
      }

      /* ===========================================================
         📌 6. RESCISÃO (GET dados)
      =========================================================== */
      case "rescisao": {
        if (!contratoId)
          return NextResponse.json(
            { error: "contrato_id é obrigatório" },
            { status: 400 }
          );

        const { data: contrato, error } = await supabase
          .from("contratos")
          .select(
            `
            id,
            data_inicio,
            data_fim,
            valor_acordado,
            dia_vencimento_aluguel,
            imoveis ( titulo )
          `
          )
          .eq("id", contratoId)
          .single();

        if (error) throw error;

        return NextResponse.json({ data: contrato });
      }

      default:
        return NextResponse.json(
          { error: "View inválida." },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("Erro em /api/alugueis:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ===========================================================
   🔄 PUT — ações de renovação e rescisão
=========================================================== */
export async function PUT(req) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { view } = body;

  try {
    switch (view) {
      /* ===========================================================
         RENOVAÇÃO — aplicar reajuste
      =========================================================== */
      case "renovacao": {
        const { contrato_id, novo_valor, nova_data_fim } = body;

        const { data, error } = await supabase
          .from("contratos")
          .update({
            valor_acordado: novo_valor,
            data_fim: nova_data_fim,
            updated_at: new Date().toISOString(),
          })
          .eq("id", contrato_id)
          .select();

        if (error) throw error;

        return NextResponse.json({
          message: "Renovação aplicada com sucesso.",
          data,
        });
      }

      /* ===========================================================
         RESCISÃO — encerramento do contrato
      =========================================================== */
      case "rescisao": {
        const { contrato_id, data_rescisao } = body;

        const { data, error } = await supabase
          .from("contratos")
          .update({
            status: "encerrado",
            data_fim: data_rescisao,
            updated_at: new Date().toISOString(),
          })
          .eq("id", contrato_id)
          .select();

        if (error) throw error;

        return NextResponse.json({
          message: "Contrato rescindido com sucesso.",
          data,
        });
      }

      default:
        return NextResponse.json(
          { error: "View inválida no PUT." },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("Erro PUT /api/alugueis:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
