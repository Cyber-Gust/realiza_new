import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Converte "" → null
 * Mantém arrays intactos
 */
function sanitizePayload(payload) {
  const cleaned = {};

  for (const key in payload) {
    const value = payload[key];

    if (value === "") {
      cleaned[key] = null;
      continue;
    }

    if (Array.isArray(value)) {
      cleaned[key] = value;
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned;
}

export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();
    const { type, ...rest } = body;

    // Sanitizar dados de entrada
    let payload = sanitizePayload(rest);

    let data;

    // ======================================================
    // 👥 CRIAÇÃO DE EQUIPE (corretor / admin)
    // ======================================================
    if (type === "equipe") {
      const { nome_completo, email, cpf_cnpj, role } = payload;

      if (!email || !nome_completo) {
        return NextResponse.json(
          { error: "Nome e e-mail são obrigatórios." },
          { status: 400 }
        );
      }

      if (role === "admin") {
        return NextResponse.json(
          {
            error:
              "Perfis de administrador só podem ser criados manualmente na configuração inicial.",
          },
          { status: 403 }
        );
      }

      // Senha padrão = CPF numérico
      const senhaInicial = (cpf_cnpj || "").replace(/\D/g, "") || "123456";

      let userId;

      // ======================================================
      // 🚀 CRIA DIRETO O USUÁRIO NO AUTH
      // (sem checar antes — se der conflito, tratamos o erro)
      // ======================================================
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password: senhaInicial,
          email_confirm: true,
          user_metadata: {
            nome_completo,
            cpf_cnpj,
            role,
          },
        });

      if (authError) {
        const msg = (authError.message || "").toLowerCase();

        // E-mail duplicado
        if (
          msg.includes("exists") ||
          msg.includes("already") ||
          msg.includes("duplicate")
        ) {
          return NextResponse.json(
            {
              error:
                "Já existe um usuário com este e-mail. Não é possível criar outro.",
            },
            { status: 409 }
          );
        }

        // Outro erro real
        throw new Error(authError.message);
      }

      userId = authData?.user?.id;
      if (!userId) throw new Error("Falha ao obter ID do usuário criado.");

      // ======================================================
      // 🧱 CRIA PERFIL NO `profiles`
      // ======================================================

      // Remove campos inválidos
      delete payload.id;
      delete payload.dados_bancarios_json;
      delete payload.endereco_json;

      payload.updated_at = new Date().toISOString();

      const { data: profileData, error: profileError } = await supabase
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

    // ======================================================
    // 🏡 PERSONAS (proprietário / inquilino / cliente)
    // ======================================================
    else if (type === "personas") {
      if (!payload.nome) {
        return NextResponse.json(
          { error: "Nome é obrigatório." },
          { status: 400 }
        );
      }

      // Cliente usa tipo "cliente" no FE, mas não existe na tabela → convertemos
      if (payload.tipo === "cliente") {
        payload.tipo = "proprietario";
      } else {
        payload.tipo = payload.tipo || "proprietario";
      }

      // ID não pode vir em insert
      delete payload.id;

      payload.created_at = new Date().toISOString();
      payload.updated_at = new Date().toISOString();

      const { data: personaData, error: personaError } = await supabase
        .from("personas")
        .insert([payload])
        .select()
        .single();

      if (personaError) throw personaError;

      data = personaData;
    }

    // Tipo inválido
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
