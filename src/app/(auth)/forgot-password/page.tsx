"use client"

import { useState } from "react"
import Link from "next/link"
import { useToast } from "@/components/ui/toast"
import { createClient } from "@/lib/supabase/client"
import { PawPrint, Mail, ArrowLeft, Send, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { addToast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        addToast(error.message, "error")
        return
      }

      setIsSubmitted(true)
      addToast("Email enviado! Verifique sua caixa de entrada.", "success")
    } catch {
      addToast("Erro ao enviar email. Tente novamente.", "error")
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
            Recuperar Senha
          </h1>
          <p className="text-[#94a3b8] text-[0.95rem]">
            {isSubmitted
              ? "Verifique seu email"
              : "Digite seu email para recuperar"}
          </p>
        </div>

        {isSubmitted ? (
          /* Success State */
          <div className="flex flex-col items-center text-center" style={{ gap: '24px' }}>
            <div className="h-20 w-20 rounded-full bg-[#ecfdf5] flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-[#10b981]" />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <p className="text-[15px] text-[#64748b] leading-relaxed">
                Enviamos um link de recuperação para
              </p>
              <p className="text-[15px] font-semibold text-[#1e293b]" style={{ marginTop: '4px' }}>
                {email}
              </p>
              <p className="text-[14px] text-[#94a3b8]" style={{ marginTop: '12px' }}>
                Verifique sua caixa de entrada e spam.
              </p>
            </div>
            <Link href="/login" className="w-full">
              <button
                className="w-full h-[52px] flex items-center justify-center gap-2.5 rounded-xl border-2 border-[#e2e8f0] bg-white text-[#475569] font-semibold hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar para login
              </button>
            </Link>
          </div>
        ) : (
          /* Form State */
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white font-semibold shadow-lg shadow-purple-400/30 hover:shadow-purple-400/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Enviar link de recuperação
                </>
              )}
            </button>

            {/* Back to Login */}
            <Link href="/login" className="w-full">
              <button
                type="button"
                className="w-full h-[52px] flex items-center justify-center gap-2.5 rounded-xl border-2 border-[#e2e8f0] bg-white text-[#475569] font-semibold hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar para login
              </button>
            </Link>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-[#cbd5e1] text-sm border-t border-[#f1f5f9]" style={{ marginTop: '40px', paddingTop: '24px' }}>
          Pet Care Schedule v1.0 • 2026
        </p>
      </div>
    </div>
  )
}
