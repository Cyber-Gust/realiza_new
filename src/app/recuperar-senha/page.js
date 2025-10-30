'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
// Para esta página, usamos o cliente supabase, pois a API route
// é apenas para o *callback*, não para iniciar o pedido.
import { createClient } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  const handleReset = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    // Esta é a URL para onde o usuário será enviado DEPOIS
    // de clicar no link e ser validado pela API 'api/auth/callback'.
    const redirectTo = `${window.location.origin}/recuperar-senha/update`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background">
      {/* Fundo com imagem */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src="/background-login.jpg"
          alt="Background"
          fill
          className="object-cover opacity-100"
          priority
        />
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm"></div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-primary/80 backdrop-blur-lg rounded-xl shadow-2xl border border-secondary">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="Logo Realiza Imóveis" width={180} height={40} />
        </div>

        <h2 className="text-xl font-bold text-center text-primary-foreground">
          Recuperar Senha
        </h2>

        {success ? (
          <div className="text-center">
            <p className="text-lg text-primary-foreground">Link enviado!</p>
            <p className="mt-2 text-muted">Verifique seu e-mail para continuar.</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-muted">
                Seu Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 mt-1 text-primary-foreground bg-secondary/50 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {error && <p className="text-sm text-center text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold text-accent-foreground bg-accent rounded-md hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar Link"}
            </button>
          </form>
        )}
        
        <div className="text-sm text-center">
          <Link href="/login" className="font-medium text-accent hover:underline">
            Lembrou a senha? Voltar ao Login
          </Link>
        </div>

      </div>
    </div>
  )
}
