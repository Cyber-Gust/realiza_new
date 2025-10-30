import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/**
 * Middleware de autenticação e autorização para o Next.js App Router.
 * * 1. Atualiza a sessão do usuário em cada requisição.
 * 2. Redireciona usuários não autenticados de rotas protegidas para /login.
 * 3. Redireciona usuários autenticados de rotas de login para seus dashboards.
 * 4. Aplica autorização baseada em 'role' (admin vs. corretor).
 */
export async function middleware(request) {
  // 1. Cria uma resposta. Iremos usá-la para passar ou atualizar cookies.
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Cria um cliente Supabase para o servidor (específico para middleware)
  // Isso atualiza o cookie de sessão se ele tiver expirado.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Pega a sessão do usuário e o caminho atual
  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // 4. Define suas rotas
  // Rotas que exigem login
  const protectedRoutes = ['/admin', '/corretor']
  // Rotas que um usuário logado NÃO deve ver
  const authPages = ['/login', '/recuperar-senha']

  // ======================================================
  // LÓGICA PARA USUÁRIOS NÃO AUTENTICADOS (session IS NULL)
  // ======================================================
  if (!session) {
    // 4.1. Se não está logado e tenta acessar uma rota protegida...
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      // Redireciona para /login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    
    // 4.2. Se não está logado e acessa qualquer outra página (pública ou login),
    // apenas permite a passagem.
    return response
  }

  // ======================================================
  // LÓGICA PARA USUÁRIOS AUTENTICADOS (session EXISTS)
  // ======================================================
  
  // 5. Pega o 'role' do usuário da sua tabela 'profiles'
  // (Isso é crucial para a autorização)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
    
  const userRole = profile?.role // 'admin', 'corretor', 'cliente', etc.

  // 5.1. Se está logado e tenta acessar a página de login/recuperar...
  if (authPages.some(page => pathname === page)) {
    // Redireciona para o dashboard correto com base no 'role'
    const url = request.nextUrl.clone()
    
    if (userRole === 'admin') {
      url.pathname = '/admin/dashboard'
    } else if (userRole === 'corretor') {
      url.pathname = '/corretor/dashboard'
    } else {
      url.pathname = '/' // Fallback para outros tipos (cliente, etc)
    }
    return NextResponse.redirect(url)
  }

  // 5.2. Lógica de AUTORIZAÇÃO (o bônus)
  // Se um usuário que NÃO é 'admin' tenta acessar as rotas /admin...
  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    const url = request.nextUrl.clone()
    // Envia ele para o dashboard de corretor (se for) ou para a home
    url.pathname = (userRole === 'corretor') ? '/corretor/dashboard' : '/'
    return NextResponse.redirect(url)
  }
  
  // Se um usuário que NÃO é 'admin' E NÃO é 'corretor' tenta acessar /corretor...
  if (pathname.startsWith('/corretor') && !['admin', 'corretor'].includes(userRole)) {
    const url = request.nextUrl.clone()
    url.pathname = '/' // Envia para a home (ex: um 'cliente')
    return NextResponse.redirect(url)
  }

  // 6. Se passou por todas as checagens, permite o acesso.
  return response
}

// Configuração do Matcher
export const config = {
  matcher: [
    /*
     * Executa o middleware em todas as rotas, EXCETO:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (ícone)
     * - /api/auth (rotas de callback do Supabase)
     *
     * Isso garante que a sessão do usuário seja sempre
     * atualizada (refresh) em cada navegação.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}