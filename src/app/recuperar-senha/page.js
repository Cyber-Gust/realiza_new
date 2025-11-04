'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
      setEmail('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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

        <h2 className="text-xl font-semibold text-center text-primary-foreground">
          Recuperar Senha
        </h2>
        <p className="text-sm text-center text-muted-foreground">
          Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-muted">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 text-primary-foreground bg-secondary/50 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && <p className="text-sm text-center text-red-400">{error}</p>}
          {success && <p className="text-sm text-center text-green-400">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-accent-foreground bg-accent rounded-md hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-accent hover:underline">
              Voltar ao login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
