// src/app/api/perfis/update/route.js
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Converte "" → null
 */
function sanitizePayload(payload) {
  const cleaned = {};

  for (const key in payload) {
    const value = payload[key];

    if (value === "") cleaned[key] = null;
    else if (Array.isArray(value)) cleaned[key] = value;
    else cleaned[key] = value;
  }

  return cleaned;
}

export async function PUT(req) {
  try {
    // ========================================================
    // 🔐 1) PEGAR USUÁRIO LOGADO (usando SEU client)
    // ========================================================
    const cookieClient = await createClient();
    const service = createServiceClient();

    const {
      data: { user: currentUser },
    } = await cookieClient.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const currentId = currentUser.id;
    const currentRole = currentUser.user_metadata.role;

    // ========================================================
    // 2) PROCESSAR PAYLOAD
    // ========================================================
    const body = await req.json();
    const { id, type, role, tipo, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }

    let data;

    /* ======================================================================
       👥 UPDATE EQUIPE
    ====================================================================== */
    if (type === "equipe") {
      // ---------------------------------------------------------------
      // 🔍 1) Buscar perfil alvo
      // ---------------------------------------------------------------
      const { data: target, error: targetError } = await service
        .from("profiles")
        .select("id, role")
        .eq("id", id)
        .single();

      if (targetError) throw targetError;
      if (!target) {
        return NextResponse.json(
          { error: "Perfil não encontrado." },
          { status: 404 }
        );
      }

      const targetRole = target.role;
      const targetId = target.id;

      // ---------------------------------------------------------------
      // 🛡 2) Regras de permissão
      // ---------------------------------------------------------------

      // a) Corretor só edita a si mesmo
      if (currentRole === "corretor" && currentId !== targetId) {
        return NextResponse.json(
          { error: "Corretores não podem editar outros perfis." },
          { status: 403 }
        );
      }

      // b) Admin não edita outro Admin
      if (
        currentRole === "admin" &&
        targetRole === "admin" &&
        currentId !== targetId
      ) {
        return NextResponse.json(
          { error: "Administradores não podem editar outros administradores." },
          { status: 403 }
        );
      }

      // ---------------------------------------------------------------
      // 🔄 3) Atualizar metadata no AUTH
      // ---------------------------------------------------------------
      const { error: authError } = await service.auth.admin.updateUserById(id, {
        email: rest.email,
        user_metadata: {
          nome_completo: rest.nome_completo,
          cpf_cnpj: rest.cpf_cnpj,
          role: role, // admin pode trocar
        },
      });

      if (authError) {
        console.error("Erro Auth:", authError);
        throw new Error("Falha ao atualizar usuário no Auth.");
      }

      // ---------------------------------------------------------------
      // 🧱 4) UPDATE NA TABELA PROFILES
      // ---------------------------------------------------------------
      let payload = {
        ...rest,
        role,
        updated_at: new Date().toISOString(),
      };

      payload = sanitizePayload(payload);

      delete payload.dados_bancarios_json;
      delete payload.endereco_json;

      const { data: profile, error } = await service
        .from("profiles")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      data = profile;
    }

    /* ======================================================================
       🏡 UPDATE PERSONAS
    ====================================================================== */
    else if (type === "personas") {
      let payload = {
        ...rest,
        updated_at: new Date().toISOString(),
      };

      if (tipo === "cliente") {
        delete payload.tipo;
      } else {
        payload.tipo = tipo || rest.tipo || "proprietario";
      }

      payload = sanitizePayload(payload);
      delete payload.endereco_json;

      const { data: persona, error } = await service
        .from("personas")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      data = persona;
    }

    /* ======================================================================
       ❌ Tipo inválido
    ====================================================================== */
    else {
      return NextResponse.json(
        { error: "Tipo inválido. Use equipe ou personas." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Perfil atualizado com sucesso!",
      data,
    });

  } catch (err) {
    console.error("❌ Erro update:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
