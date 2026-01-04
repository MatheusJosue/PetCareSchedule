import Link from "next/link"
import { getDashboardStats, getUpcomingAppointments } from "@/lib/queries/admin"
import {
  Calendar,
  Users,
  PawPrint,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  CalendarClock,
  ArrowRight,
} from "lucide-react"

export default async function AdminDashboardPage() {
  let stats = {
    upcomingCount: 0,
    weekCount: 0,
    totalClients: 0,
    totalPets: 0,
    pendingCount: 0,
    upcomingRevenue: 0,
  }
  let upcomingAppointments: Awaited<ReturnType<typeof getUpcomingAppointments>> = []

  try {
    stats = await getDashboardStats()
    upcomingAppointments = await getUpcomingAppointments(10)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
  }

  const statusStyles: Record<string, { bg: string; text: string }> = {
    pending: { bg: "var(--accent-yellow-bg)", text: "var(--accent-yellow)" },
    confirmed: { bg: "var(--accent-blue-bg)", text: "var(--accent-blue)" },
    completed: { bg: "var(--accent-green-bg)", text: "var(--accent-green)" },
    cancelled: { bg: "var(--accent-red-bg)", text: "var(--accent-red)" },
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Visão geral do seu negócio
          </p>
        </div>
        <div
          className="flex items-center text-sm rounded-xl"
          style={{
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-primary)'
          }}
        >
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: '16px' }}>
        <div
          className="rounded-2xl border transition-colors duration-200"
          style={{
            padding: '20px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div className="flex items-center" style={{ gap: '16px' }}>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30">
              <CalendarClock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[2rem] font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.upcomingCount}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Próximos</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border transition-colors duration-200"
          style={{
            padding: '20px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div className="flex items-center" style={{ gap: '16px' }}>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-blue-400/30">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[2rem] font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.weekCount}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Esta semana</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border transition-colors duration-200"
          style={{
            padding: '20px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div className="flex items-center" style={{ gap: '16px' }}>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center shadow-lg shadow-emerald-400/30">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[2rem] font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.totalClients}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Clientes</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border transition-colors duration-200"
          style={{
            padding: '20px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div className="flex items-center" style={{ gap: '16px' }}>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#ec4899] to-[#f472b6] flex items-center justify-center shadow-lg shadow-pink-400/30">
              <PawPrint className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[2rem] font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.totalPets}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {stats.pendingCount > 0 && (
        <div
          className="rounded-2xl border-l-4 flex items-center"
          style={{
            padding: '16px 20px',
            gap: '12px',
            background: 'var(--accent-yellow-bg)',
            borderColor: 'var(--accent-yellow)',
            border: '1px solid var(--border-primary)',
            borderLeftWidth: '4px',
            borderLeftColor: 'var(--accent-yellow)'
          }}
        >
          <AlertCircle className="h-5 w-5" style={{ color: 'var(--accent-yellow)' }} />
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Você tem <strong>{stats.pendingCount}</strong> agendamento(s)
            pendente(s) aguardando confirmação.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2" style={{ gap: '24px' }}>
        {/* Upcoming Schedule */}
        <div
          className="rounded-2xl border transition-colors duration-200"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div
            className="flex items-center justify-between border-b"
            style={{
              padding: '20px 24px',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div className="flex items-center" style={{ gap: '12px' }}>
              <CalendarClock className="h-5 w-5" style={{ color: 'var(--accent-purple)' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Próximos Agendamentos
              </h2>
            </div>
            <Link
              href="/admin/appointments"
              className="flex items-center text-sm font-medium transition-colors hover:opacity-80"
              style={{ gap: '4px', color: 'var(--accent-purple)' }}
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div style={{ padding: '12px 16px' }} className="sm:p-6">
            {upcomingAppointments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col sm:flex-row sm:items-center rounded-xl transition-colors duration-200"
                    style={{
                      padding: '12px',
                      gap: '12px',
                      background: 'var(--bg-tertiary)'
                    }}
                  >
                    <div className="flex items-center justify-between sm:justify-start" style={{ gap: '12px' }}>
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <div className="text-center" style={{ minWidth: '50px' }}>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {new Date(appointment.scheduled_date + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </p>
                          <p className="text-base sm:text-lg font-bold" style={{ color: 'var(--accent-purple)' }}>
                            {appointment.scheduled_time?.slice(0, 5)}
                          </p>
                        </div>
                        <div className="hidden sm:block w-px h-8" style={{ background: 'var(--border-primary)' }} />
                      </div>
                      <span
                        className="text-xs font-semibold rounded-full sm:hidden flex-shrink-0"
                        style={{
                          padding: '4px 10px',
                          background: statusStyles[appointment.status]?.bg,
                          color: statusStyles[appointment.status]?.text
                        }}
                      >
                        {statusLabels[appointment.status]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                        {(appointment.user as { name?: string })?.name || 'Cliente'}
                      </p>
                      <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                        {(appointment.pet as { name?: string })?.name} - {(appointment.service as { name?: string })?.name}
                      </p>
                    </div>
                    <span
                      className="text-xs font-semibold rounded-full hidden sm:inline-block flex-shrink-0"
                      style={{
                        padding: '6px 12px',
                        background: statusStyles[appointment.status]?.bg,
                        color: statusStyles[appointment.status]?.text
                      }}
                    >
                      {statusLabels[appointment.status]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center" style={{ padding: '32px' }}>
                <Calendar className="h-12 w-12 mx-auto opacity-50" style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }}>Nenhum agendamento próximo</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue */}
        <div
          className="rounded-2xl border transition-colors duration-200"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div
            className="flex items-center border-b"
            style={{
              padding: '20px 24px',
              gap: '12px',
              borderColor: 'var(--border-primary)'
            }}
          >
            <DollarSign className="h-5 w-5" style={{ color: 'var(--accent-green)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Receita Esperada
            </h2>
          </div>
          <div style={{ padding: '24px' }}>
            <div className="text-center" style={{ padding: '24px 0' }}>
              <p className="text-4xl font-bold" style={{ color: 'var(--accent-green)' }}>
                {formatCurrency(stats.upcomingRevenue)}
              </p>
              <p className="text-sm" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                Baseado em {stats.upcomingCount} agendamentos futuros
              </p>
            </div>

            <div
              className="grid grid-cols-2 border-t"
              style={{ gap: '16px', paddingTop: '24px', marginTop: '24px', borderColor: 'var(--border-primary)' }}
            >
              <div className="text-center">
                <div className="flex items-center justify-center" style={{ gap: '4px', color: 'var(--accent-yellow)' }}>
                  <Clock className="h-4 w-4" />
                  <span className="text-lg font-bold">
                    {upcomingAppointments.filter((a) => a.status === "pending").length}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pendentes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center" style={{ gap: '4px', color: 'var(--accent-blue)' }}>
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-lg font-bold">
                    {upcomingAppointments.filter((a) => a.status === "confirmed").length}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Confirmados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
