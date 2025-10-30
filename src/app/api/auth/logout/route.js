import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = await createClient()

  // Limpa a sessão (apaga o cookie)
  await supabase.auth.signOut()

  // Cria uma URL de redirecionamento para o login
  const url = new URL('/login', request.url)
  
  // Retorna uma resposta de redirecionamento
  // Usamos 303 (See Other) que é o padrão para redirecionar após um POST
  return NextResponse.redirect(url, 303)
}