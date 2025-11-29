// src/app/api/perfis/delete/route.js
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function DELETE(req) {
  try {
    // =======================================================
    // 🔐 1) Identificar usuário logado via SEU createClient()
    // =======================================================
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

    const currentRole = currentUser.user_metadata.role;
    const currentId = currentUser.id;

    // =======================================================
    // 2) Receber payload
    // =======================================================
    const { id, type } = await req.json();

    if (!id || !type) {
      return NextResponse.json(
        { error: "ID e tipo são obrigatórios." },
        { status: 400 }
      );
    }

    // =======================================================
    // 3) Determinar tabela
    // =======================================================
    let table = null;

    if (type === "equipe") table = "profiles";
    else if (type === "personas" || type === "clientes") table = "personas";
    else {
      return NextResponse.json(
        { error: `Tipo inválido: ${type}.` },
        { status: 400 }
      );
    }

    // =======================================================
    // 🛡️ 4) Regras de permissão para EQUIPE
    // =======================================================
    if (type === "equipe") {
      // Buscar o perfil alvo
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

      // 1) Corretores não removem ninguém
      if (currentRole === "corretor") {
        return NextResponse.json(
          { error: "Corretores não podem remover perfis." },
          { status: 403 }
        );
      }

      // 2) Admin não remove outro Admin
      if (
        currentRole === "admin" &&
        targetRole === "admin" &&
        id !== currentId
      ) {
        return NextResponse.json(
          {
            error:
              "Administradores não podem remover outros administradores.",
          },
          { status: 403 }
        );
      }

      // 3) Admin pode remover ele mesmo → permitido
    }

    // =======================================================
    // 5) Remover da tabela
    // =======================================================
    const { error: deleteError } = await service
      .from(table)
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // =======================================================
    // 6) Remover do AUTH se for equipe
    // =======================================================
    if (type === "equipe") {
      const { error: authError } = await service.auth.admin.deleteUser(id);

      if (authError) {
        console.warn("⚠️ Erro ao remover usuário do Auth:", authError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Removido com sucesso!",
    });

  } catch (err) {
    console.error("❌ Erro ao remover perfil:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
