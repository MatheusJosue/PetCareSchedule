"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Home, Calendar, PawPrint, User, Plus, AlertCircle } from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { href: "/", label: "Inicio", icon: <Home className="h-5 w-5" /> },
  { href: "/appointments", label: "Agenda", icon: <Calendar className="h-5 w-5" /> },
  { href: "/appointments/new", label: "Agendar", icon: <Plus className="h-6 w-6" /> },
  { href: "/pets", label: "Pets", icon: <PawPrint className="h-5 w-5" /> },
  { href: "/profile", label: "Perfil", icon: <User className="h-5 w-5" /> },
]

export function MobileNav() {
  const pathname = usePathname()
  const { profile, isLoading } = useAuth()

  // Verificar se o endereço está completo
  const hasCompleteAddress = Boolean(
    profile?.address_street &&
    profile?.address_number &&
    profile?.address_city &&
    profile?.address_state
  )

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ margin: '0 12px 12px 12px' }}>
        <div
          className="rounded-2xl border transition-colors duration-200"
          style={{
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const isCenter = item.href === "/appointments/new"

              if (isCenter) {
                // Se não tem endereço completo, redireciona para o perfil
                const targetHref = hasCompleteAddress ? item.href : "/profile"

                return (
                  <Link
                    key={item.href}
                    href={targetHref}
                    className="flex items-center justify-center relative group"
                    style={{ marginTop: '-32px' }}
                  >
                    {/* Glow effect */}
                    <div className={cn(
                      "absolute inset-0 h-16 w-16 rounded-full blur-lg transition-opacity",
                      hasCompleteAddress
                        ? "bg-gradient-to-br from-[#7c3aed] to-[#a855f7] opacity-40 group-hover:opacity-60"
                        : "bg-gray-400 opacity-30"
                    )} />

                    {/* Button */}
                    <div className={cn(
                      "relative h-14 w-14 rounded-full flex items-center justify-center text-white transform transition-all duration-200",
                      hasCompleteAddress
                        ? "bg-gradient-to-br from-[#7c3aed] to-[#a855f7] shadow-xl shadow-purple-400/40 group-hover:scale-110 group-active:scale-95"
                        : "bg-gray-400 shadow-lg"
                    )}>
                      {hasCompleteAddress ? (
                        <Plus className="h-7 w-7" />
                      ) : (
                        <AlertCircle className="h-6 w-6" />
                      )}
                    </div>
                  </Link>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl transition-all duration-200 group relative"
                  )}
                  style={{
                    padding: '8px 12px',
                    color: isActive ? 'var(--accent-purple)' : 'var(--text-muted)'
                  }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7]" />
                  )}

                  <span className={cn(
                    "transition-transform duration-200 group-hover:scale-110"
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive && "font-semibold"
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
