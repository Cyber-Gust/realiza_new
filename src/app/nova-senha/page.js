'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Toast from '@/components/admin/ui/Toast'

export default function NovaSenhaPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()

    if (password.length < 6) {
      Toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      Toast.error('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      Toast.success('Senha redefinida com sucesso! Redirecionando...')

      // Espera 2 segundos antes de redirecionar
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      Toast.error(err.message || 'Erro ao redefinir senha.')
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
          Redefinir Senha
        </h2>
        <p className="text-sm text-center text-muted-foreground">
          Escolha uma nova senha para acessar sua conta.
        </p>

        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label htmlFor="password" className="text-sm font-medium text-muted">
              Nova senha
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
            <label htmlFor="confirm" className="text-sm font-medium text-muted">
              Confirmar nova senha
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-2 mt-1 text-primary-foreground bg-secondary/50 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-accent-foreground bg-accent rounded-md hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Atualizando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
