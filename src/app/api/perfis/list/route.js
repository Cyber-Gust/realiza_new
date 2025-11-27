// src/app/api/perfis/list/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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

  try {
    let data = [];

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
      }));
    }

    /* ============================================================
        👤 CLIENTES — subset da tabela personas
    ============================================================ */
    else if (type === "clientes") {
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
        .eq("tipo", "cliente")
        .order("updated_at", { ascending: false });

      if (id) query = query.eq("id", id);

      const { data: rows, error } = await query;
      if (error) throw error;

      data = rows.map((p) => ({
        ...p,
        type: "clientes",
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

    /* ============================================================
        Resposta normal — lista completa
    ============================================================ */
    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Erro list:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
