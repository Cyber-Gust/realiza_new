// src/app/api/perfis/update/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Converte "" em null
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

export async function PUT(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();
    const { id, type, role, tipo, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID obrigatório." },
        { status: 400 }
      );
    }

    let data;

    /* ======================================================================
       👥 EQUIPE — tabela profiles
       ====================================================================== */
    if (type === "equipe") {
      if (role === "admin") {
        return NextResponse.json(
          {
            error:
              "Perfis de administrador só podem ser alterados nas Configurações de Conta.",
          },
          { status: 403 }
        );
      }

      let payload = {
        ...rest,
        role,
        updated_at: new Date().toISOString(),
      };

      payload = sanitizePayload(payload);

      delete payload.dados_bancarios_json;
      delete payload.endereco_json;

      const { data: profile, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      data = profile;
    }

    /* ======================================================================
       🏡 PERSONAS (proprietário | inquilino | cliente)
       tabela personas
       ====================================================================== */
    else if (type === "personas") {
      let payload = {
        ...rest,
        updated_at: new Date().toISOString(),
      };

      // ======================================================
      // 🔥 REGRA MAIS IMPORTANTE:
      // Se o form enviou tipo="cliente", NÃO alterar o tipo no banco!
      // ======================================================
      const isCliente = tipo === "cliente";

      if (isCliente) {
        // Cliente mantém seu tipo atual no BD. Ignora o campo.
        delete payload.tipo;
      } else {
        // Personas (proprietário / inquilino)
        payload.tipo = tipo || rest.tipo || "proprietario";
      }

      payload = sanitizePayload(payload);

      delete payload.endereco_json;

      const { data: persona, error } = await supabase
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
