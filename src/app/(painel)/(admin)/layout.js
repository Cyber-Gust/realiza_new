import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import AdminClientLayout from "./AdminClientLayout"; // 👈 importa o seu layout client

/**
 * 🔒 Layout de segurança do painel admin
 * - Verifica sessão e role via Supabase
 * - Roda no servidor (SSR)
 * - Encapsula o layout client-side com sidebar e header
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();

  // 🔹 Cria o client SSR (com cookies válidos)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );

  // 🔹 Busca usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 🔹 Verifica o papel (role)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/"); // bloqueia acesso de não-admins
  }

  // 🔹 Retorna o layout client-side com o painel
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
