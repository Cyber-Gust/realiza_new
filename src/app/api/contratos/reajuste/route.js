import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/contratos/reajuste?contrato_id=...
 * Retorna valor atual + histórico
 */
export async function GET(req) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);

    const contrato_id = searchParams.get("contrato_id");

    if (!contrato_id) {
      return NextResponse.json(
        { error: "contrato_id é obrigatório" },
        { status: 400 }
      );
    }

    const { data: contrato, error } = await supabase
      .from("contratos")
      .select("id, valor_acordado, reajustes_manuais, ultimo_reajuste_em, valor_reajustado")
      .eq("id", contrato_id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        contrato_id: contrato.id,
        valor_atual: contrato.valor_acordado,
        historico: contrato.reajustes_manuais || [],
        ultimo_reajuste_em: contrato.ultimo_reajuste_em,
        valor_reajustado: contrato.valor_reajustado,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Erro inesperado" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contratos/reajuste
 * body: { contrato_id, percentual?, valor_novo }
 */
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { contrato_id, percentual, valor_novo } = body;

    if (!contrato_id) {
      return NextResponse.json(
        { error: "contrato_id é obrigatório" },
        { status: 400 }
      );
    }

    if (valor_novo === null || valor_novo === undefined || Number(valor_novo) <= 0) {
      return NextResponse.json(
        { error: "valor_novo inválido" },
        { status: 400 }
      );
    }

    const supabaseService = createServiceClient();

    // ✅ contrato atual (fonte da verdade)
    const { data: contrato, error: errContrato } = await supabaseService
      .from("contratos")
      .select("id, valor_acordado, reajustes_manuais")
      .eq("id", contrato_id)
      .single();

    if (errContrato) {
      return NextResponse.json(
        { error: errContrato.message },
        { status: 500 }
      );
    }

    const valor_antigo = Number(contrato.valor_acordado || 0);
    const novoValor = Number(valor_novo);

    if (!valor_antigo || valor_antigo <= 0) {
      return NextResponse.json(
        { error: "valor_acordado atual inválido no contrato" },
        { status: 400 }
      );
    }

    if (novoValor === valor_antigo) {
      return NextResponse.json(
        { error: "O valor novo não pode ser igual ao valor atual." },
        { status: 400 }
      );
    }

    // ✅ busca nome do usuário
    const { data: perfil } = await supabaseService
      .from("profiles")
      .select("id, nome_completo, email")
      .eq("id", auth.user.id)
      .single();

    const user_nome =
      perfil?.nome_completo ||
      auth.user.user_metadata?.nome ||
      auth.user.email ||
      "Usuário";

    // ✅ histórico no JSONB
    const itemHistorico = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      valor_antigo,
      percentual: percentual ?? null,
      valor_novo: novoValor,
      user_id: auth.user.id,
      user_nome,
    };

    const historicoAtual = Array.isArray(contrato.reajustes_manuais)
      ? contrato.reajustes_manuais
      : [];

    const novoHistorico = [itemHistorico, ...historicoAtual];

    // ✅ atualiza contrato PRIMEIRO
    const hojeDate = new Date().toISOString().slice(0, 10);

    const { data: updated, error: errUpdate } = await supabaseService
      .from("contratos")
      .update({
        valor_acordado: novoValor,
        ultimo_reajuste_em: hojeDate,
        valor_reajustado: novoValor,
        reajustes_manuais: novoHistorico,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contrato_id)
      .select("id, valor_acordado, reajustes_manuais, ultimo_reajuste_em, valor_reajustado")
      .single();

    // ✅ SE DEU ERRO AQUI, PARA TUDO
    if (errUpdate) {
      return NextResponse.json(
        { error: errUpdate.message },
        { status: 500 }
      );
    }

    // =======================================
    // ✅ Atualizar aluguéis futuros (próximo mês em diante)
    // + registrar valor anterior no dados_cobranca_json
    // =======================================
    const now = new Date();
    const competenciaAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { data: transacoes, error: errTransacoes } = await supabaseService
      .from("transacoes")
      .select("id, valor, dados_cobranca_json")
      .eq("contrato_id", contrato_id)
      .eq("modulo_financeiro", "ALUGUEL")
      .eq("tipo", "receita_aluguel")
      .eq("status", "pendente");

    if (errTransacoes) {
      return NextResponse.json(
        { error: errTransacoes.message },
        { status: 500 }
      );
    }

    const futuras = (transacoes || []).filter((t) => {
      const comp = t?.dados_cobranca_json?.competencia;
      if (!comp) return false;
      return comp > competenciaAtual; // ✅ ignora mês atual
    });

    if (futuras.length) {
      const agoraISO = new Date().toISOString();

      for (const t of futuras) {
        if (Number(t.valor) === Number(novoValor)) {
            continue;
        }

        const valorAnterior = Number(t.valor || 0);

        const dadosAntigos = t.dados_cobranca_json || {};

        const historicoAtual = Array.isArray(dadosAntigos.historico_reajustes)
        ? dadosAntigos.historico_reajustes
        : [];

        const novoEvento = {
        reajustado_em: agoraISO,
        origem: "manual",
        contrato_id: contrato_id,

        valor_anterior: valorAnterior,
        valor_novo: Number(novoValor),

        user_id: auth.user.id,
        user_nome: user_nome,

        motivo: "Reajuste manual do contrato",
        };

        const dadosAtualizados = {
        ...dadosAntigos,

        // ✅ mantém esses também se você quiser ter “atalhos rápidos”
        valor_anterior: valorAnterior,
        reajustado_em: agoraISO,

        // ✅ histórico real (não sobrescreve nada)
        historico_reajustes: [novoEvento, ...historicoAtual],
        };

        const { error: errUpd } = await supabaseService
        .from("transacoes")
        .update({
            valor: Number(novoValor),
            dados_cobranca_json: dadosAtualizados,
            updated_at: agoraISO,
        })
        .eq("id", t.id);

        if (errUpd) {
          return NextResponse.json(
            { error: errUpd.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      message: "Reajuste aplicado com sucesso ✅",
      data: {
        contrato_id: updated.id,
        valor_atual: updated.valor_acordado,
        historico: updated.reajustes_manuais || [],
        ultimo_reajuste_em: updated.ultimo_reajuste_em,
        valor_reajustado: updated.valor_reajustado,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Erro inesperado" },
      { status: 500 }
    );
  }
}