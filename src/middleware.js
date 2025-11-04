import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * Middleware de autenticação e autorização para o Next.js App Router.
 * - Valida e atualiza a sessão Supabase em cada requisição.
 * - Redireciona usuários conforme o 'role' (admin, corretor, etc).
 * - Bloqueia acesso a rotas protegidas se o usuário não estiver autenticado.
 */
export async function middleware(request) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // 🔹 Cria cliente Supabase SSR com suporte a cookies do Next 15
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // ===============================================
  // 🔒 Validação segura da sessão
  // ===============================================
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Sessão não encontrada ou expirada:", error.message);
      }
    }
    user = data?.user || null;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Erro ao validar sessão:", err.message);
    }
  }

  const { pathname } = request.nextUrl;
  const protectedRoutes = ["/admin", "/corretor"];
  const authPages = ["/login", "/recuperar-senha", "/nova-senha"];

  // ===============================================
  // 🚫 Usuário NÃO autenticado
  // ===============================================
  if (!user) {
    if (protectedRoutes.some((r) => pathname.startsWith(r))) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return response; // rotas públicas passam direto
  }

  // ===============================================
  // ✅ Usuário autenticado — carrega o perfil
  // ===============================================
  let userRole = "cliente";
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle(); // 🔹 evita erro se o perfil não existir

    if (!error && profile?.role) userRole = profile.role;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Erro ao carregar perfil:", err.message);
    }
  }

  // ===============================================
  // 🔁 Redireciona usuário logado tentando acessar login
  // ===============================================
  if (authPages.includes(pathname)) {
    const url = request.nextUrl.clone();
    if (userRole === "admin") url.pathname = "/admin/dashboard";
    else if (userRole === "corretor") url.pathname = "/corretor/dashboard";
    else url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // ===============================================
  // 🔐 Regras de acesso por role
  // ===============================================
  if (pathname.startsWith("/admin") && userRole !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = userRole === "corretor" ? "/corretor/dashboard" : "/";
    return NextResponse.redirect(url);
  }

  if (
    pathname.startsWith("/corretor") &&
    !["admin", "corretor"].includes(userRole)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // ===============================================
  // ✅ Tudo certo — segue a requisição normalmente
  // ===============================================
  return response;
}

// ===============================================
// ⚙️ Configuração do matcher
// ===============================================
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
