'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login')
      }

      // ✅ Redireciona via reload completo para acionar o middleware SSR
      window.location.href = "/dashboard"
      
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background">
      {/* 🖼️ Fundo com imagem e overlay */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src="/background-login.jpg"
          alt="Background de login"
          fill
          className="object-cover opacity-100"
          priority
        />
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm"></div>
      </div>

      {/* 💳 Card de login */}
      <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-primary/80 backdrop-blur-lg rounded-xl shadow-2xl border border-secondary animate-fadeIn">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="Logo Realiza Imóveis"
            width={180}
            height={40}
            className="drop-shadow-lg"
          />
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 mt-1 rounded-md border border-secondary text-primary-foreground bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-muted">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 mt-1 rounded-md border border-secondary text-primary-foreground bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground"
              placeholder="••••••••"
            />
          </div>

          {/* Mensagem de erro */}
          {error && (
            <p className="text-sm text-center text-red-400 bg-red-950/30 py-2 rounded-md border border-red-800/40">
              {error}
            </p>
          )}

          {/* Link "Esqueceu a senha" */}
          <div className="text-sm text-right">
            <Link
              href="/recuperar-senha"
              className="font-medium text-accent hover:underline hover:text-accent/80 transition-all"
            >
              Esqueceu a senha?
            </Link>
          </div>

          {/* Botão de login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-accent-foreground bg-accent rounded-md hover:bg-accent/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
