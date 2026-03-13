import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const STAGES = [
  "novo",
  "qualificado",
  "visita_agendada",
  "proposta_feita",
  "documentacao",
  "concluido",
  "perdido",
];

export async function GET() {
  const supabase = await createClient();
  const service = createServiceClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { data, error } = await service
      .from("leads")
      .select(`
        id,
        nome,
        email,
        telefone,
        status,
        origem,
        corretor_id,
        imovel_interesse_id,
        faixa_preco_max,
        created_at,
        updated_at,
        profiles:corretor_id (
          id,
          nome_completo,
          role
        ),
        imoveis:imovel_interesse_id (
          id,
          codigo_ref,
          titulo,
          endereco_cidade,
          endereco_bairro
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const grouped = STAGES.reduce((acc, stage) => {
      acc[stage] = [];
      return acc;
    }, {});

    for (const lead of data || []) {
      const status = lead.status || "novo";

      const corretor_nome =
        lead?.profiles?.nome_completo || "Sem corretor";

      const imovel_interesse = lead?.imoveis
        ? [
            lead.imoveis.codigo_ref,
            lead.imoveis.titulo,
            lead.imoveis.endereco_bairro,
            lead.imoveis.endereco_cidade,
          ]
            .filter(Boolean)
            .join(" • ")
        : null;

      const normalizedLead = {
        ...lead,
        corretor: lead.profiles || null,
        corretor_nome,
        imovel_interesse,
      };

      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(normalizedLead);
    }

    return NextResponse.json({ data: grouped });
  } catch (err) {
    console.error("❌ GET /api/crm/pipeline_geral:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao carregar pipeline geral." },
      { status: 500 }
    );
  }
}