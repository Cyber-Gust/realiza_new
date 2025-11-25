import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import AdminClientLayout from "./AdminClientLayout"; 

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 🔹 CORREÇÃO 1: Traga todos os dados, não só a role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*") // Mudado de "role" para "*" (ou liste: role, nome_completo, avatar_url)
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/"); 
  }

  // 🔹 CORREÇÃO 2: Passe o user e profile para o componente filho
  return (
    // 👇 OBRIGATÓRIO passar as props aqui para o Client Layout receber
    <AdminClientLayout user={user} profile={profile}>
        {children}
    </AdminClientLayout>
  );
}