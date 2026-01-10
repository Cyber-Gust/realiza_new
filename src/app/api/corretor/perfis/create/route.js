// src/app/api/perfis/create/route.js
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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

export async function POST(req) {
  try {
    // ============================================================
    // 🔐 1) PEGAR USUÁRIO LOGADO — getSession() (NÃO usa auth.users)
    // ============================================================
    const cookieClient = await createClient();
    const service = createServiceClient();

    const {
      data: { user: currentUser },
      error: userError
    } = await cookieClient.auth.getUser();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const currentRole = currentUser.user_metadata?.role;

    if (currentRole !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar perfis de equipe." },
        { status: 403 }
      );
    }

    // ============================================================
    // 2) PROCESSAR PAYLOAD
    // ============================================================
    const body = await req.json();
    const { type, ...rest } = body;

    let payload = sanitizePayload(rest);
    let data;

    // ============================================================
    // 👥 EQUIPE
    // ============================================================
    if (type === "equipe") {
      const { nome_completo, email, cpf_cnpj, role } = payload;

      if (!email || !nome_completo) {
        return NextResponse.json(
          { error: "Nome e e-mail são obrigatórios." },
          { status: 400 }
        );
      }

      const senhaInicial = (cpf_cnpj || "").replace(/\D/g, "") || "123456";

      const { data: authData, error: authError } =
        await service.auth.admin.createUser({
          email,
          password: senhaInicial,
          email_confirm: true,
          user_metadata: {
            nome_completo,
            cpf_cnpj,
            role: role || "corretor",
          },
        });

      if (authError) {
        const msg = authError.message.toLowerCase();

        if (
          msg.includes("exists") ||
          msg.includes("already") ||
          msg.includes("duplicate")
        ) {
          return NextResponse.json(
            { error: "Já existe um usuário com este e-mail." },
            { status: 409 }
          );
        }

        throw new Error(authError.message);
      }

      const userId = authData?.user?.id;
      if (!userId) throw new Error("Falha ao obter ID do usuário criado.");

      delete payload.id;
      delete payload.dados_bancarios_json;
      delete payload.endereco_json;

      payload.updated_at = new Date().toISOString();

      const { data: profileData, error: profileError } = await service
        .from("profiles")
        .upsert(
          [
            {
              id: userId,
              ...payload,
              role: role || "corretor",
              avatar_url: "/placeholder-avatar.png",
            },
          ],
          { onConflict: "id" }
        )
        .select()
        .single();

      if (profileError) throw profileError;

      data = profileData;
    }

    // ============================================================
    // 🏡 PERSONAS
    // ============================================================
    else if (type === "personas") {
      if (!payload.nome) {
        return NextResponse.json(
          { error: "Nome é obrigatório." },
          { status: 400 }
        );
      }

      payload.tipo = payload.tipo || "cliente";

      delete payload.id;

      payload.created_at = new Date().toISOString();
      payload.updated_at = new Date().toISOString();

      const { data: personaData, error: personaError } = await service
        .from("personas")
        .insert([payload])
        .select()
        .single();

      if (personaError) throw personaError;

      data = personaData;
    }

    else {
      return NextResponse.json(
        { error: "Tipo de cadastro inválido." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Cadastro criado com sucesso!",
      data,
    });

  } catch (err) {
    console.error("❌ Erro create:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
