import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 📘 Rota CRUD para Personas (proprietários, inquilinos, clientes)
 * Usa o client com Service Role → ignora RLS
 * Permite filtros por tipo e busca textual.
 */

// 🔹 Listar personas
export async function GET(req) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);

    const tipo = searchParams.get("tipo"); // proprietario | inquilino | cliente
    const q = searchParams.get("q"); // busca textual

    let query = supabase.from("personas").select("*", { count: "exact" });

    if (tipo && tipo !== "all") query = query.eq("tipo", tipo);
    if (q) {
      query = query.or(`nome.ilike.%${q}%,email.ilike.%${q}%,telefone.ilike.%${q}%`);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (err) {
    console.error("❌ Erro ao listar personas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 Criar nova persona
export async function POST(req) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();

    const { nome, email, telefone, cpf_cnpj, tipo, endereco_json, observacoes } = body;

    if (!nome || !tipo)
      return NextResponse.json({ error: "Nome e tipo são obrigatórios" }, { status: 400 });

    const { data, error } = await supabase
      .from("personas")
      .insert([{ nome, email, telefone, cpf_cnpj, tipo, endereco_json, observacoes }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("❌ Erro ao criar persona:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 Atualizar persona
export async function PUT(req) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    const { data, error } = await supabase
      .from("personas")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("❌ Erro ao atualizar persona:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 Deletar persona
export async function DELETE(req) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    const { error } = await supabase.from("personas").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao deletar persona:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
