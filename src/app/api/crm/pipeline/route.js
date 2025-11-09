import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 🔹 GET → Lista pipeline (somente leads do corretor autenticado)
 * 🔹 POST/PUT → Atualiza status de um lead
 */
export async function GET() {
  const supabase = await createClient();
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("leads")
      .select("id, nome, telefone, email, status, origem, corretor_id, created_at")
      .eq("corretor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

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

// POST e PUT têm o mesmo comportamento
export async function POST(req) {
  return handleUpdate(req);
}
export async function PUT(req) {
  return handleUpdate(req);
}

async function handleUpdate(req) {
  const supabase = await createClient();

  try {
    const { id, new_status } = await req.json();

    if (!id || !new_status) {
      return NextResponse.json(
        { error: "ID e novo status são obrigatórios." },
        { status: 400 }
      );
    }

    // 🔐 Usuário autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    // 🔎 Verifica se o lead é do corretor autenticado
    const { data: lead, error: leadError } = await supabase
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
    const { data, error } = await supabase
      .from("leads")
      .update({ status: new_status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "Lead atualizado com sucesso!",
      data,
    });
  } catch (err) {
    console.error("❌ UPDATE /crm/pipeline:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
