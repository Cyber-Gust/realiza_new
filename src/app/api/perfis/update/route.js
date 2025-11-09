//src/app/api/perfis/update
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PUT(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();
    const { id, type, role, tipo, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    let data, error;

    // ======================================================
    // 👥 EQUIPE (admins + corretores)
    // ======================================================
    if (type === "equipe") {
      // 🔒 Bloqueio preventivo — admin só altera em Configurações
      if (role === "admin") {
        return NextResponse.json(
          { error: "Perfis de administrador só podem ser alterados nas Configurações" },
          { status: 403 }
        );
      }

      const updatePayload = {
        ...rest,
        role,
        updated_at: new Date().toISOString(),
      };

      if (typeof rest.dados_bancarios_json === "string" && rest.dados_bancarios_json.trim() !== "") {
        try {
          updatePayload.dados_bancarios_json = JSON.parse(rest.dados_bancarios_json);
        } catch {
          throw new Error("Formato inválido de Dados Bancários (use JSON válido)");
        }
      }

      ({ data, error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single());
    }

    // ======================================================
    // 🏡 PERSONAS (proprietário, inquilino, cliente)
    // ======================================================
    else if (type === "personas") {
      const updatePayload = {
        ...rest,
        tipo,
        updated_at: new Date().toISOString(),
      };

      if (typeof rest.endereco_json === "string" && rest.endereco_json.trim() !== "") {
        try {
          updatePayload.endereco_json = JSON.parse(rest.endereco_json);
        } catch {
          throw new Error("Formato inválido de Endereço (use JSON válido)");
        }
      }

      ({ data, error } = await supabase
        .from("personas")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single());
    }

    // ======================================================
    // 💬 LEADS
    // ======================================================
    else if (type === "leads") {
      const updatePayload = {
        ...rest,
        updated_at: new Date().toISOString(),
      };

      if (typeof rest.perfil_busca_json === "string" && rest.perfil_busca_json.trim() !== "") {
        try {
          updatePayload.perfil_busca_json = JSON.parse(rest.perfil_busca_json);
        } catch {
          throw new Error("Formato inválido de Preferências (use JSON válido)");
        }
      }

      ({ data, error } = await supabase
        .from("leads")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single());
    }

    // ======================================================
    // ❌ Tipo inválido
    // ======================================================
    else {
      return NextResponse.json(
        { error: "Tipo de perfil inválido" },
        { status: 400 }
      );
    }

    if (error) throw error;

    return NextResponse.json({
      message: "Perfil atualizado com sucesso!",
      data,
    });
  } catch (err) {
    console.error("❌ Erro update:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
