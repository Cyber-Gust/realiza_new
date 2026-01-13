// src/app/api/perfis/list/route.js
import { NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";

/**
 * Listagem unificada:
 * 🔹 /api/perfis/list?type=equipe
 * 🔹 /api/perfis/list?type=personas
 * 🔹 /api/perfis/list?type=clientes
 * 🔹 /api/perfis/list?type=equipe&id=UUID
 */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const mode = searchParams.get("mode"); // "select" = payload enxuto

  try {
    let data = [];

      const toSelectOption = (p) => ({
        value: String(p.id),
        label: p.nome || p.nome_completo || p.email || "Sem nome",
        telefone: p.contato_telefone || p.whatsapp || p.telefone || null,
        type: p.type,
        role: p.role || null,
      });

    /* ============================================================
        👥 EQUIPE — tabela profiles
    ============================================================ */
    if (type === "equipe") {
      let query = supabase
        .from("profiles")
        .select(
          `
            id,
            nome_completo,
            email,
            telefone,
            cpf_cnpj,
            role,
            creci,
            avatar_url,
            slug,
            resumo,
            detalhes,
            bio_publica,
            linkedin,
            instagram,
            whatsapp,
            banco,
            agencia,
            conta,
            tipo_conta,
            pix,
            favorecido,
            endereco_cep,
            endereco_logradouro,
            endereco_numero,
            endereco_bairro,
            endereco_cidade,
            endereco_estado,
            data_nascimento,
            ativo,
            updated_at
          `
        )
        .order("updated_at", { ascending: false });

      if (id) query = query.eq("id", id);

      const { data: rows, error } = await query;
      if (error) throw error;

      data = rows.map((p) => ({
        ...p,
        type: "equipe",
        contato_telefone: p.whatsapp || p.telefone || null,
      }));
    }

    /* ============================================================
        🏡 PERSONAS — proprietários + inquilinos
    ============================================================ */
    else if (type === "personas") {
      let query = supabase
        .from("personas")
        .select(
          `
            id,
            nome,
            email,
            telefone,
            cpf_cnpj,
            tipo,
            endereco_cep,
            endereco_logradouro,
            endereco_numero,
            endereco_bairro,
            endereco_cidade,
            endereco_estado,
            data_nascimento,
            rg,
            estado_civil,
            profissao,
            origem,
            tags,
            observacoes,
            ativo,
            updated_at
          `
        )
        .neq("tipo", "cliente") // exclui clientes daqui
        .order("updated_at", { ascending: false });

      if (id) query = query.eq("id", id);

      const { data: rows, error } = await query;
      if (error) throw error;

      data = rows.map((p) => ({
        ...p,
        type: "personas",
        contato_telefone: p.telefone || null,
      }));
    }

    /* ============================================================
        👤 CLIENTES — subset da tabela personas
    ============================================================ */
    else if (type === "clientes") {
    // 🔐 Cliente normal (corretor)
    const supabaseUser = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    let query = supabaseUser
      .from("personas")
      .select(
        `
          id,
          nome,
          email,
          telefone,
          cpf_cnpj,
          tipo,
          endereco_cep,
          endereco_logradouro,
          endereco_numero,
          endereco_bairro,
          endereco_cidade,
          endereco_estado,
          data_nascimento,
          rg,
          estado_civil,
          profissao,
          origem,
          tags,
          observacoes,
          ativo,
          updated_at
        `
      )
      .eq("tipo", "cliente")
      .eq("corretor_id", user.id) // 🔥 FILTRO CRÍTICO
      .order("updated_at", { ascending: false });

    if (id) query = query.eq("id", id);

    const { data: rows, error } = await query;
    if (error) throw error;

    data = rows.map((p) => ({
      ...p,
      type: "clientes",
      contato_telefone: p.telefone || null,
    }));
  }

    /* ============================================================
        ❌ TIPO INVÁLIDO
    ============================================================ */
    else {
      return NextResponse.json(
        {
          error:
            "Tipo inválido. Use 'equipe', 'personas' ou 'clientes'. Leads agora fazem parte do módulo CRM.",
        },
        { status: 400 }
      );
    }

    /* ============================================================
        Se veio um ID → retornar só o objeto
    ============================================================ */
    if (id) {
      const item = Array.isArray(data) ? data[0] : data;
      return NextResponse.json({ data: item || null });
    }

     // 👇 Payload enxuto para selects
    if (mode === "select") {
      return NextResponse.json({ data: (data || []).map(toSelectOption) });
    }

    /* ============================================================
        Resposta normal — lista completa
    ============================================================ */
    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Erro list:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
