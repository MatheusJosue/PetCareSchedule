"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Clock,
  PawPrint,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  MapPin,
} from "lucide-react"

interface Appointment {
  id: string
  pet: { name: string; species: string }
  service: { name: string; base_price: number }
  scheduled_date: string
  scheduled_time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
}

export default function ClientHomePage() {
  const { user, profile, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  // Verificar se o endereço está completo
  const hasCompleteAddress = Boolean(
    profile?.address_street &&
    profile?.address_number &&
    profile?.address_city &&
    profile?.address_state
  )

  const [isLoading, setIsLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [petsCount, setPetsCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)

  // Buscar dados do dashboard
  useEffect(() => {
    async function fetchDashboardData() {
      if (authLoading) return
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Buscar agendamentos próximos (pending ou confirmed)
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            scheduled_date,
            scheduled_time,
            status,
            pets:pet_id (name, species),
            services:service_id (name, base_price)
          `)
          .eq('user_id', user.id)
          .in('status', ['pending', 'confirmed'])
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true })
          .limit(5)

        if (appointmentsError) throw appointmentsError

        const formattedAppointments = (appointmentsData || []).map((apt: Record<string, unknown>) => ({
          id: apt.id as string,
          scheduled_date: apt.scheduled_date as string,
          scheduled_time: apt.scheduled_time as string,
          status: apt.status as "pending" | "confirmed" | "completed" | "cancelled",
          pet: apt.pets as { name: string; species: string },
          service: apt.services as { name: string; base_price: number },
        }))

        setAppointments(formattedAppointments)

        // Buscar contagem de pets
        const { count, error: petsError } = await supabase
          .from('pets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (petsError) throw petsError
        setPetsCount(count || 0)

        // Buscar contagem de agendamentos concluídos
        const { count: completedTotal, error: completedError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')

        if (completedError) throw completedError
        setCompletedCount(completedTotal || 0)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, authLoading])

  const getPetEmoji = (species: string) => {
    const emojis: Record<string, string> = {
      cachorro: "🐕",
      gato: "🐈",
      outro: "🐾",
    }
    return emojis[species] || "🐾"
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const pendingCount = appointments.filter((a) => a.status === "pending").length
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length

  // Obter primeiro nome do usuário
  const firstName = profile?.name?.split(' ')[0] || ''

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Welcome Skeleton */}
        <div
          className="rounded-2xl border animate-pulse"
          style={{
            padding: '32px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            height: '180px'
          }}
        />
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '12px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border animate-pulse"
              style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                height: '76px'
              }}
            />
          ))}
        </div>
        {/* Appointments Skeleton */}
        <div>
          <div className="h-6 w-48 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)', marginBottom: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl border animate-pulse"
                style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)',
                  height: '80px'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Address Warning */}
      {!hasCompleteAddress && (
        <div
          className="rounded-2xl flex items-start"
          style={{
            padding: '16px 20px',
            gap: '12px',
            background: 'var(--accent-yellow-bg)',
            border: '1px solid var(--border-primary)',
            borderLeftWidth: '4px',
            borderLeftColor: 'var(--accent-yellow)',
          }}
        >
          <AlertCircle
            className="h-5 w-5 flex-shrink-0 mt-0.5"
            style={{ color: 'var(--accent-yellow)' }}
          />
          <div className="flex-1">
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Complete seu endereço para agendar
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
              Precisamos do seu endereço para realizar o atendimento domiciliar.
            </p>
            <Link href="/profile">
              <Button size="sm" variant="outline" style={{ marginTop: '12px' }}>
                <MapPin className="h-4 w-4" />
                Completar endereço
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div
        className="rounded-2xl border relative overflow-hidden"
        style={{
          padding: '32px',
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] opacity-10 rounded-full blur-3xl" style={{ marginRight: '-128px', marginTop: '-128px' }} />

        <div className="relative z-10">
          <div style={{ marginBottom: '24px' }}>
            <h1
              className="text-[1.75rem] font-bold tracking-tight"
              style={{ marginBottom: '8px', color: 'var(--text-primary)' }}
            >
              {firstName ? `Olá, ${firstName}! 👋` : 'Bem-vindo! 👋'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Agende banho e tosa para seu pet com facilidade.
            </p>
          </div>

          {hasCompleteAddress ? (
            <Link href="/appointments/new">
              <Button size="lg">
                <Plus className="h-5 w-5" />
                Novo Agendamento
              </Button>
            </Link>
          ) : (
            <Button size="lg" disabled title="Complete seu endereço para agendar">
              <Plus className="h-5 w-5" />
              Novo Agendamento
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '12px' }}>
        <div
          className="rounded-xl border"
          style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {confirmedCount}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Confirmados</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border"
          style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {pendingCount}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Pendentes</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border"
          style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {completedCount}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Concluídos</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border"
          style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] flex items-center justify-center flex-shrink-0">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {petsCount}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Pets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Próximos Agendamentos
          </h2>
          <Link href="/appointments">
            <Button variant="ghost" size="sm" style={{ color: 'var(--accent-purple)' }}>
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {appointments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {appointments.slice(0, 3).map((appointment) => (
              <div
                key={appointment.id}
                className={cn(
                  "rounded-xl border",
                  appointment.status === "confirmed" && "border-l-4 border-l-[#10b981]",
                  appointment.status === "pending" && "border-l-4 border-l-[#f59e0b]"
                )}
                style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <div className="flex items-center" style={{ gap: '12px' }}>
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-xl">
                    {getPetEmoji(appointment.pet?.species || 'outro')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center" style={{ gap: '8px', marginBottom: '2px' }}>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {appointment.pet?.name || 'Pet'}
                      </p>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {appointment.service?.name || 'Serviço'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(appointment.scheduled_date)}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {appointment.scheduled_time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl border text-center"
            style={{
              padding: '48px 24px',
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center mx-auto"
              style={{ marginBottom: '16px', background: 'var(--accent-purple-bg)' }}
            >
              <Calendar className="h-7 w-7" style={{ color: 'var(--accent-purple)' }} />
            </div>
            <h3 className="font-semibold" style={{ marginBottom: '4px', color: 'var(--text-primary)' }}>
              Nenhum agendamento
            </h3>
            <p className="text-sm" style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
              {hasCompleteAddress
                ? 'Agende o primeiro serviço para seu pet'
                : 'Complete seu endereço para poder agendar'
              }
            </p>
            {hasCompleteAddress ? (
              <Link href="/appointments/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  Agendar
                </Button>
              </Link>
            ) : (
              <Link href="/profile">
                <Button variant="outline">
                  <MapPin className="h-4 w-4" />
                  Completar endereço
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
