// src/lib/supabase/server.js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // ✅ Aguarda a Promise de cookies()
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Leitura
        get(name) {
          return cookieStore.get(name)?.value
        },
        // Escrita
        set(name, value, options) {
          try {
            // Em escrita, chamamos cookies() novamente (sem await)
            cookies().then(c => c.set({ name, value, ...options }))
          } catch (err) {}
        },
        // Remoção
        remove(name, options) {
          try {
            cookies().then(c => c.set({ name, value: '', ...options }))
          } catch (err) {}
        },
      },
    }
  )
}
