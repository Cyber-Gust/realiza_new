import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // A URL para onde o usuário será enviado após a troca de código.
  // Veio do 'redirectTo' que você definiu em /recuperar-senha/page.js
  const next = searchParams.get('next') || '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redireciona para a URL 'next' (ex: /recuperar-senha/update)
      return NextResponse.redirect(new URL(next, request.url).toString())
    }
  }

  // URL de fallback em caso de erro
  const errorUrl = new URL('/login', request.url)
  errorUrl.searchParams.set('error', 'Nao foi possivel validar seu link.')
  return NextResponse.redirect(errorUrl)
}