// src/app/api/perfis/delete/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function DELETE(req) {
  const supabase = createServiceClient();

  try {
    const { id, type } = await req.json();

    if (!id || !type) {
      return NextResponse.json(
        { error: "ID e tipo são obrigatórios." },
        { status: 400 }
      );
    }

    /* ==========================================================
       Seleção da tabela corretamente mapeada
       ========================================================== */
    let table = null;

    if (type === "equipe") table = "profiles";
    else if (type === "personas" || type === "clientes") table = "personas";
    else {
      return NextResponse.json(
        { error: `Tipo inválido: ${type}.` },
        { status: 400 }
      );
    }

    /* ==========================================================
       Proteção reforçada → ADMIN não pode ser excluído
       ========================================================== */
    if (type === "equipe") {
      const { data: perfil, error: fetchError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (!perfil) {
        return NextResponse.json(
          { error: "Perfil não encontrado." },
          { status: 404 }
        );
      }

      if (perfil.role === "admin") {
        return NextResponse.json(
          {
            error:
              "Perfis de administrador não podem ser removidos pelo painel.",
          },
          { status: 403 }
        );
      }
    }

    /* ==========================================================
       Remoção da tabela
       ========================================================== */
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    /* ==========================================================
       Remover usuário da AUTH caso seja Equipe
       ========================================================== */
    if (type === "equipe") {
      const { error: authError } = await supabase.auth.admin.deleteUser(id);

      // Nunca quebrar o DELETE se o Auth falhar.
      if (authError) {
        console.warn("⚠️ Erro ao remover da Auth:", authError.message);
      }
    }

    return NextResponse.json({
      message: "Removido com sucesso!",
      success: true,
    });
  } catch (err) {
    console.error("❌ Erro ao remover perfil:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
