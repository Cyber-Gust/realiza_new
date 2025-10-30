'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
// Esta página é acessada *após* o callback da API,
// então o usuário já está em uma sessão de "recuperação".
// Usamos o cliente supabase para atualizar a senha.
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2500)
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
          Definir Nova Senha
        </h2>

        {success ? (
           <div className="text-center">
            <p className="text-lg text-green-400">Senha atualizada!</p>
            <p className="mt-2 text-muted">Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="password" className="text-sm font-medium text-muted">
                Nova Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 mt-1 text-primary-foreground bg-secondary/50 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-muted">
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Salvando..." : "Salvar Nova Senha"}
            </button>
          </form>
        )}

        {!success && (
          <div className="text-sm text-center">
            <Link href="/login" className="font-medium text-accent hover:underline">
              Cancelar e voltar ao Login
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
