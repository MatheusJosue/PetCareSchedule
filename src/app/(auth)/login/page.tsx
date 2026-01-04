"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { createClient } from "@/lib/supabase/client"
import { PawPrint, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        addToast(error.message, "error")
        return
      }

      addToast("Login realizado com sucesso!", "success")
      router.push("/")
      router.refresh()
    } catch {
      addToast("Erro ao fazer login. Tente novamente.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
      {/* Card Container */}
      <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.08)]" style={{ padding: '56px 48px' }}>
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center" style={{ marginBottom: '40px' }}>
          <div className="h-[72px] w-[72px] rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#7c3aed] to-[#a855f7] shadow-xl shadow-purple-400/40" style={{ marginBottom: '24px' }}>
            <PawPrint className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-[1.75rem] font-bold text-[#1e293b] tracking-tight" style={{ marginBottom: '8px' }}>
            Pet Care
          </h1>
          <p className="text-[#94a3b8] text-[0.95rem]">
            Entre para gerenciar seus agendamentos
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                placeholder="••••••••"
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
            <div className="flex justify-end mt-3">
              <Link
                href="/forgot-password"
                className="text-[13px] text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[52px] mt-2 flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white font-semibold shadow-lg shadow-purple-400/30 hover:shadow-purple-400/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <div className="text-center" style={{ marginTop: '32px' }}>
          <p className="text-[0.95rem] text-[#64748b]">
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="text-[#7c3aed] hover:text-[#6d28d9] font-semibold hover:underline transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>

        {/* Footer - dentro do card */}
        <p className="text-center text-[#cbd5e1] text-sm border-t border-[#f1f5f9]" style={{ marginTop: '40px', paddingTop: '24px' }}>
          Pet Care Schedule v1.0 • 2026
        </p>
      </div>
    </div>
  )
}
