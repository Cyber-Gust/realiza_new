// src/app/(painel)/(corretor)/layout.js

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import CorretorClientLayout from "./CorretorClientLayout";

export const dynamic = "force-dynamic";

export default async function CorretorLayout({ children }) {
  // No Next.js 15+, cookies() deve ser aguardado (await)
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Agora cookieStore já é o objeto resolvido e o .get() funcionará
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 🔒 Segurança REAL: corretor não entra em admin
  if (!profile || profile.role !== "corretor") {
    redirect("/");
  }

  return (
    <CorretorClientLayout user={user} profile={profile}>
      {children}
    </CorretorClientLayout>
  );
}