"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { createClient } from "@/lib/supabase/client"
import { PawPrint, Mail, Lock, User, Eye, EyeOff, UserPlus } from "lucide-react"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      addToast("As senhas não coincidem", "error")
      return
    }

    if (password.length < 6) {
      addToast("A senha deve ter pelo menos 6 caracteres", "error")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) {
        addToast(error.message, "error")
        return
      }

      addToast("Conta criada! Verifique seu email para confirmar.", "success")
      router.push("/login")
    } catch {
      addToast("Erro ao criar conta. Tente novamente.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
      {/* Card Container */}
      <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.08)]" style={{ padding: '48px 48px' }}>
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center" style={{ marginBottom: '36px' }}>
          <div className="h-[72px] w-[72px] rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#7c3aed] to-[#a855f7] shadow-xl shadow-purple-400/40" style={{ marginBottom: '24px' }}>
            <PawPrint className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-[1.75rem] font-bold text-[#1e293b] tracking-tight" style={{ marginBottom: '8px' }}>
            Criar Conta
          </h1>
          <p className="text-[#94a3b8] text-[0.95rem]">
            Cadastre-se para agendar serviços
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Name Field */}
          <div>
            <label className="block text-[13px] font-medium text-[#475569] mb-2.5">
              Nome completo
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                <User className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ paddingLeft: '48px', paddingRight: '16px' }}
                className="w-full h-[52px] rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#1e293b] text-[15px] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/20 transition-all"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-[13px] font-medium text-[#475569] mb-2.5">
              E-mail
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '48px', paddingRight: '16px' }}
                className="w-full h-[52px] rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#1e293b] text-[15px] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/20 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[13px] font-medium text-[#475569] mb-2.5">
              Senha
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                className="w-full h-[52px] rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#1e293b] text-[15px] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-[13px] font-medium text-[#475569] mb-2.5">
              Confirmar senha
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                className="w-full h-[52px] rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#1e293b] text-[15px] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[52px] flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white font-semibold shadow-lg shadow-purple-400/30 hover:shadow-purple-400/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
            style={{ marginTop: '8px' }}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Criar conta
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <div className="text-center" style={{ marginTop: '28px' }}>
          <p className="text-[0.95rem] text-[#64748b]">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-[#7c3aed] hover:text-[#6d28d9] font-semibold hover:underline transition-colors"
            >
              Fazer login
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[#cbd5e1] text-sm border-t border-[#f1f5f9]" style={{ marginTop: '32px', paddingTop: '24px' }}>
          Pet Care Schedule v1.0 • 2026
        </p>
      </div>
    </div>
  )
}
