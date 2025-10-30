import { NextResponse } from 'next/server'
// Importe seu cliente Supabase (lado do SERVIDOR)
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const { email, password } = await request.json()
  
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  // Se o login for bem-sucedido, o createClient (server) já 
  // cuidou de definir o cookie de sessão na resposta.
  return NextResponse.json({ message: 'Login bem-sucedido!', user: data.user }, { status: 200 })
}