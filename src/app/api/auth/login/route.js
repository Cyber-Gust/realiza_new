// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const { email, password } = await request.json()
  const supabase = await createClient()

  // Login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  // Busca a role do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle()

  const role = profile?.role || "cliente"

  return NextResponse.json(
    { message: "Login bem-sucedido!", user: data.user, role },
    { status: 200 }
  )
}
