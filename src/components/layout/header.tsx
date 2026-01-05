"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { useTheme } from "@/contexts/theme-context"
import {
  Menu,
  X,
  PawPrint,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Scissors,
  Settings,
  LogOut,
  Home,
  Calendar,
  User,
  Sun,
  Moon,
  CreditCard,
  Receipt,
} from "lucide-react"

interface HeaderProps {
  variant?: "client" | "admin"
  user?: {
    name: string | null
    email: string
    avatar_url?: string | null
  }
}

const clientNavItems = [
  { href: "/", label: "Início", icon: <Home className="h-5 w-5" /> },
  { href: "/appointments", label: "Agendamentos", icon: <Calendar className="h-5 w-5" /> },
  { href: "/pets", label: "Pets", icon: <PawPrint className="h-5 w-5" /> },
  { href: "/profile", label: "Perfil", icon: <User className="h-5 w-5" /> },
]

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/admin/calendar", label: "Agenda", icon: <CalendarDays className="h-5 w-5" /> },
  { href: "/admin/appointments", label: "Agendamentos", icon: <ClipboardList className="h-5 w-5" /> },
  { href: "/admin/customers", label: "Clientes", icon: <Users className="h-5 w-5" /> },
  { href: "/admin/subscriptions", label: "Assinaturas", icon: <Receipt className="h-5 w-5" /> },
  { href: "/admin/services", label: "Serviços", icon: <Scissors className="h-5 w-5" /> },
  { href: "/admin/plans", label: "Planos", icon: <CreditCard className="h-5 w-5" /> },
  { href: "/admin/settings", label: "Configurações", icon: <Settings className="h-5 w-5" /> },
]

export function Header({ variant = "client", user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const navItems = variant === "admin" ? adminNavItems : clientNavItems
  const { theme, toggleTheme } = useTheme()

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header className="sticky top-0 z-40">
        <div style={{ padding: '12px 16px' }}>
          <div
            className="rounded-2xl border transition-colors duration-200"
            style={{
              padding: '12px 20px',
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link
                href={variant === "admin" ? "/admin" : "/"}
                className="flex items-center gap-3 group"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30 group-hover:shadow-purple-400/50 transition-all duration-200 group-hover:scale-105">
                  <PawPrint className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] leading-tight" style={{ color: 'var(--text-primary)' }}>Pet Care</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {variant === "admin" ? "Admin" : "Schedule"}
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center" style={{ gap: '4px' }}>
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && item.href !== "/admin" && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 text-[14px] font-medium rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white shadow-md shadow-purple-400/20"
                          : "hover:bg-[var(--bg-tertiary)]"
                      )}
                      style={{
                        padding: '10px 16px',
                        color: isActive ? 'white' : 'var(--text-muted)'
                      }}
                    >
                      {item.icon}
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Right side */}
              <div className="flex items-center" style={{ gap: '8px' }}>
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 border"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-muted)'
                  }}
                  aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                >
                  {theme === 'light' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </button>

                {/* Desktop Logout */}
                <form action="/api/auth/signout" method="post" className="hidden md:block">
                  <button
                    type="submit"
                    className="flex items-center gap-2 text-[14px] font-medium rounded-xl transition-all duration-200"
                    style={{
                      padding: '10px 16px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="hidden lg:inline">Sair</span>
                  </button>
                </form>

                {user && (
                  <Avatar
                    src={user.avatar_url}
                    alt={user.name || user.email}
                    fallback={user.name?.charAt(0) || user.email.charAt(0)}
                    size="sm"
                    className="ring-2 ring-[var(--border-primary)]"
                  />
                )}

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
                  className="md:hidden h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 border"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-muted)'
                  }}
                >
                  {isMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Offcanvas Menu */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 transition-opacity duration-300",
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
            isMenuOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Offcanvas Panel */}
        <div
          className={cn(
            "absolute top-0 left-0 h-full w-[280px] transition-transform duration-300 ease-out flex flex-col",
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          style={{
            background: 'var(--bg-secondary)',
            boxShadow: 'var(--shadow-xl)'
          }}
        >
          {/* Offcanvas Header */}
          <div
            className="flex items-center justify-between border-b"
            style={{
              padding: '16px 20px',
              borderColor: 'var(--border-primary)'
            }}
          >
            <Link
              href={variant === "admin" ? "/admin" : "/"}
              className="flex items-center gap-3"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30">
                <PawPrint className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[15px] leading-tight" style={{ color: 'var(--text-primary)' }}>
                  Pet Care
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {variant === "admin" ? "Admin" : "Schedule"}
                </span>
              </div>
            </Link>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 border"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-muted)'
              }}
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div
              className="border-b"
              style={{
                padding: '16px 20px',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="flex items-center" style={{ gap: '12px' }}>
                <Avatar
                  src={user.avatar_url}
                  alt={user.name || user.email}
                  fallback={user.name?.charAt(0) || user.email.charAt(0)}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.name || 'Usuário'}
                  </p>
                  <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav
            className="flex-1 overflow-y-auto"
            style={{
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {navItems.map((item, index) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && item.href !== "/admin" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 text-[14px] font-medium transition-all duration-200 rounded-xl",
                    isActive
                      ? "bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white shadow-lg shadow-purple-400/20"
                      : "hover:bg-[var(--bg-tertiary)]"
                  )}
                  style={{
                    padding: '14px 16px',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <span className={cn(
                    "transition-transform duration-200",
                    isActive && "text-white"
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Bottom Actions */}
          <div
            className="border-t"
            style={{
              padding: '16px',
              borderColor: 'var(--border-primary)'
            }}
          >
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full text-[14px] font-medium rounded-xl transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
              style={{
                padding: '14px 16px',
                color: 'var(--text-secondary)',
                marginBottom: '8px'
              }}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </button>

            {/* Logout Button */}
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full text-[14px] font-semibold rounded-xl transition-all duration-200 border"
                style={{
                  padding: '14px 16px',
                  background: 'var(--accent-red-bg)',
                  borderColor: 'var(--accent-red)',
                  color: 'var(--accent-red)'
                }}
              >
                <LogOut className="h-5 w-5" />
                Sair da conta
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
