import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/* ============================================================
   📌 GET /api/crm/pipeline
   Retorna o pipeline do corretor autenticado
   ============================================================ */
export async function GET() {
  const supabase = await createClient();

  try {
    // 🔐 Autenticação
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

    // 🔹 Busca apenas leads do corretor autenticado
    const { data, error } = await supabase
      .from("leads")
      .select("id, nome, telefone, email, status, origem, corretor_id, created_at")
      .eq("corretor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 🔹 Agrupa por status (como o front espera)
    const grouped = data.reduce((acc, lead) => {
      acc[lead.status] = acc[lead.status] || [];
      acc[lead.status].push(lead);
      return acc;
    }, {});

    return NextResponse.json({ data: grouped });
  } catch (err) {
    console.error("❌ GET /crm/pipeline:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   📌 POST / PUT /api/crm/pipeline
   Atualiza status do lead (movimentação no pipeline)
   ============================================================ */
export async function POST(req) {
  return handleUpdate(req);
}

export async function PUT(req) {
  return handleUpdate(req);
}

async function handleUpdate(req) {
  const supabase = await createClient();
  const service = createServiceClient();

  try {
    const body = await req.json();

    // Suporta duas nomenclaturas (compatibilidade CRMKanbanCard / CRMPipeline)
    const id = body.id || body.lead_id;
    const newStatus = body.new_status || body.next_stage;

    if (!id || !newStatus) {
      return NextResponse.json(
        { error: "ID e novo status são obrigatórios." },
        { status: 400 }
      );
    }

    // 🔐 Autenticação
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

    // 🔎 Verifica se o lead pertence ao corretor
    const { data: lead, error: leadError } = await service
      .from("leads")
      .select("id, corretor_id")
      .eq("id", id)
      .single();

    if (leadError) throw leadError;

    if (!lead || lead.corretor_id !== user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para alterar este lead." },
        { status: 403 }
      );
    }

    // 🚀 Atualiza o status
    const { data, error } = await service
      .from("leads")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "Lead movido com sucesso!",
      data,
    });
  } catch (err) {
    console.error("❌ UPDATE /crm/pipeline:", err.message);
    return NextResponse.json(
      { error: err.message || "Erro ao atualizar pipeline." },
      { status: 500 }
    );
  }
}
