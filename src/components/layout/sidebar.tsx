"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Home,
  Calendar,
  PawPrint,
  User,
  Settings,
  Users,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Scissors,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Receipt,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

interface SidebarProps {
  variant: "client" | "admin"
}

const clientNavItems: NavItem[] = [
  { href: "/", label: "Inicio", icon: <Home className="h-5 w-5" /> },
  { href: "/appointments", label: "Agendamentos", icon: <Calendar className="h-5 w-5" /> },
  { href: "/pets", label: "Meus Pets", icon: <PawPrint className="h-5 w-5" /> },
  { href: "/profile", label: "Perfil", icon: <User className="h-5 w-5" /> },
]

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/admin/calendar", label: "Agenda", icon: <CalendarDays className="h-5 w-5" /> },
  { href: "/admin/appointments", label: "Agendamentos", icon: <ClipboardList className="h-5 w-5" />, badge: 3 },
  { href: "/admin/customers", label: "Clientes", icon: <Users className="h-5 w-5" /> },
  { href: "/admin/subscriptions", label: "Assinaturas", icon: <Receipt className="h-5 w-5" /> },
  { href: "/admin/services", label: "Servicos", icon: <Scissors className="h-5 w-5" /> },
  { href: "/admin/plans", label: "Planos", icon: <CreditCard className="h-5 w-5" /> },
  { href: "/admin/settings", label: "Configuracoes", icon: <Settings className="h-5 w-5" /> },
]

export function Sidebar({ variant }: SidebarProps) {
  const pathname = usePathname()
  const navItems = variant === "admin" ? adminNavItems : clientNavItems
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "hidden lg:block flex-shrink-0 transition-all duration-200",
        isCollapsed ? "w-[88px]" : "w-72"
      )}
    >
      <div className={cn(
        "fixed top-4 left-4 bottom-4 z-40 transition-all duration-200",
        isCollapsed ? "w-[72px]" : "w-64"
      )}>
        <div className="flex flex-col h-full overflow-hidden bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] border border-[#f1f5f9]">
          {/* Header with Logo */}
          <div className={cn(
            "flex items-center border-b border-[#f1f5f9] flex-shrink-0",
            isCollapsed ? "justify-center" : "justify-between"
          )} style={{ padding: '20px', paddingBottom: '16px' }}>
            <Link
              href={variant === "admin" ? "/admin" : "/"}
              className={cn(
                "flex items-center gap-3 group",
                isCollapsed && "justify-center"
              )}
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30 group-hover:shadow-purple-400/50 transition-all duration-200 group-hover:scale-105">
                <PawPrint className="h-5 w-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-[#1e293b] text-[17px] leading-tight tracking-tight">
                    Pet Care
                  </span>
                  <span className="text-[12px] text-[#94a3b8]">
                    {variant === "admin" ? "Admin Panel" : "Schedule"}
                  </span>
                </div>
              )}
            </Link>

            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#94a3b8] hover:text-[#64748b] transition-all duration-200 border border-[#e2e8f0]"
                title="Recolher menu"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <div style={{ padding: '12px' }}>
              <button
                onClick={() => setIsCollapsed(false)}
                className="h-10 w-full rounded-xl flex items-center justify-center bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#94a3b8] hover:text-[#64748b] transition-all duration-200 border border-[#e2e8f0]"
                title="Expandir menu"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Navigation - scrollable area */}
          <nav className="flex-1 overflow-y-auto" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && item.href !== "/admin" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl text-[14px] font-medium transition-all duration-200 relative",
                    isCollapsed ? "justify-center" : "",
                    isActive
                      ? "bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white shadow-lg shadow-purple-400/25"
                      : "text-[#64748b] hover:text-[#1e293b] hover:bg-[#f8fafc]"
                  )}
                  style={{ padding: isCollapsed ? '12px 8px' : '12px 14px' }}
                >
                  <span
                    className={cn(
                      "transition-transform duration-200 group-hover:scale-110 shrink-0",
                      isActive && "text-white"
                    )}
                  >
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}

                  {item.badge && !isCollapsed && (
                    <span className={cn(
                      "h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center",
                      isActive ? "bg-white/25 text-white" : "bg-[#7c3aed]/15 text-[#7c3aed]"
                    )}>
                      {item.badge}
                    </span>
                  )}

                  {item.badge && isCollapsed && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#ef4444] text-[10px] text-white font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User section / Logout - fixed at bottom */}
          <div className={cn(
            "border-t border-[#f1f5f9] flex-shrink-0",
            isCollapsed && "flex flex-col items-center"
          )} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!isCollapsed && (
              <div className="rounded-xl bg-[#f8fafc] border border-[#e2e8f0]" style={{ padding: '12px 14px' }}>
                <p className="text-[11px] text-[#94a3b8] uppercase tracking-wider font-medium">Conectado como</p>
                <p className="text-[14px] font-semibold text-[#1e293b] truncate" style={{ marginTop: '2px' }}>
                  {variant === "admin" ? "Administrador" : "Cliente"}
                </p>
              </div>
            )}

            <form action="/api/auth/signout" method="post" className="w-full">
              <button
                type="submit"
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-xl",
                  "text-[14px] font-medium text-[#64748b]",
                  "hover:bg-[#fef2f2] hover:text-[#ef4444]",
                  "transition-all duration-200 group",
                  "border border-transparent hover:border-[#fecaca]",
                  isCollapsed && "justify-center"
                )}
                style={{ padding: isCollapsed ? '12px 8px' : '12px 14px' }}
                title={isCollapsed ? "Sair" : undefined}
              >
                <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform shrink-0" />
                {!isCollapsed && <span>Sair</span>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  )
}
