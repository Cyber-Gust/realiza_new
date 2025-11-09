//src/app/api/perfis/delete
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function DELETE(req) {
  const supabase = createServiceClient();

  try {
    const { id, type } = await req.json();

    if (!id || !type)
      return NextResponse.json(
        { error: "ID e tipo são obrigatórios." },
        { status: 400 }
      );

    let table;
    switch (type) {
      case "equipe":
        table = "profiles";
        break;
      case "personas":
        table = "personas";
        break;
      case "leads":
        table = "leads";
        break;
      default:
        return NextResponse.json(
          { error: `Tipo de perfil inválido: ${type}` },
          { status: 400 }
        );
    }

    // 🔒 Proteção para perfis admin
    if (type === "equipe") {
      const { data: perfil, error: fetchError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (perfil?.role === "admin") {
        return NextResponse.json(
          {
            error:
              "Perfis de administrador não podem ser removidos. O próprio admin poderá se remover em suas configurações pessoais.",
          },
          { status: 403 }
        );
      }
    }

    // 🔹 Remove da tabela correspondente
    const { error: deleteError } = await supabase.from(table).delete().eq("id", id);
    if (deleteError) throw deleteError;

    // 🔹 Se for equipe, remove também da auth.users
    if (type === "equipe") {
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) {
        console.warn("Erro ao remover da auth:", authError.message);
      }
    }

    return NextResponse.json({
      message: "Perfil removido com sucesso!",
      success: true,
    });
  } catch (err) {
    console.error("Erro ao remover perfil:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
