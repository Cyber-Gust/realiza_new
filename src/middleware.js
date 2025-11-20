import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * Middleware de autenticação e autorização.
 * - Valida sessão Supabase SSR.
 * - Redireciona conforme role (admin, corretor, etc).
 * - Protege rotas privadas.
 * - Permite rotas públicas sem ruído.
 */
export async function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // =====================================================
  // 🧠 Cria cliente Supabase com sincronização de cookies
  // =====================================================
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          try {
            response.cookies.set(name, value, options);
            requestHeaders.set("cookie", `${name}=${value}`);
          } catch {}
        },
        remove: (name, options) => {
          try {
            response.cookies.set(name, "", options);
          } catch {}
        },
      },
    }
  );

  // =====================================================
  // 🧩 Variáveis básicas de rota
  // =====================================================
  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/corretor") ||
    pathname.startsWith("/dashboard");
  const isAuthPage = ["/login", "/recuperar-senha", "/nova-senha"].includes(pathname);

  // 🔓 Rotas públicas passam direto
  if (!isProtected && !isAuthPage) return response;

  // =====================================================
  // 🔒 Busca sessão atual do Supabase
  // =====================================================
  const { data: { user } = {}, error } = await supabase.auth.getUser();

  if (!user) {
    // Se tentar acessar rota protegida sem login → redireciona pro login
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      console.log("🚫 Usuário não autenticado. Redirecionando:", pathname, "→ /login");
      return NextResponse.redirect(url);
    }
    return response;
  }


  // =====================================================
  // 🔍 Busca role do usuário
  // =====================================================
  let role = "cliente";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role) role = profile.role;
  } catch (err) {
    console.warn("⚠️ Erro ao carregar perfil:", err.message);
  }

  // =====================================================
  // 🔁 Se já logado e tentar abrir /login → redireciona pro painel
  // =====================================================
  if (isAuthPage) {
    const url = request.nextUrl.clone();

    if (role === "admin") url.pathname = "/admin/dashboard";
    else if (role === "corretor") url.pathname = "/corretor/dashboard";
    else url.pathname = "/dashboard"; // 🔹 Fallback seguro
    return NextResponse.redirect(url);
  }

  // =====================================================
  // 🛡️ Controle de acesso por role
  // =====================================================
  if (pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = role === "corretor" ? "/corretor/dashboard" : "/dashboard";
    console.log("🚫 Acesso negado a rota /admin para role:", role);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/corretor") && !["admin", "corretor"].includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    console.log("🚫 Acesso negado a rota /corretor para role:", role);
    return NextResponse.redirect(url);
  }

  // =====================================================
  // ✅ Sessão e acesso válidos → segue a requisição
  // =====================================================
  return response;
}

// =====================================================
// ⚙️ Matcher — intercepta apenas o necessário
// =====================================================
export const config = {
  matcher: [
    "/admin/:path*",
    "/corretor/:path*",
    "/dashboard/:path*",
    "/login",
    "/recuperar-senha",
    "/nova-senha",
  ],
};
