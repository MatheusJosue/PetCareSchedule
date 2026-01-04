"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Modal, ModalActions } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { StatusBadge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import {
  Calendar,
  Clock,
  Plus,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Edit3,
  Trash2,
  XCircle,
} from "lucide-react"

interface Appointment {
  id: string
  pet: { name: string; species: string }
  service: { name: string; base_price: number }
  scheduled_date: string
  scheduled_time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
}

export default function AppointmentsPage() {
  const { addToast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null)
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])

  // Buscar agendamentos do usuário
  useEffect(() => {
    async function fetchAppointments() {
      if (authLoading) return
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
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
          .order('scheduled_date', { ascending: false })

        if (error) throw error

        const formattedAppointments = (data || []).map((apt: Record<string, unknown>) => ({
          id: apt.id as string,
          scheduled_date: apt.scheduled_date as string,
          scheduled_time: apt.scheduled_time as string,
          status: apt.status as "pending" | "confirmed" | "completed" | "cancelled",
          pet: apt.pets as { name: string; species: string },
          service: apt.services as { name: string; base_price: number },
        }))

        setAppointments(formattedAppointments)
      } catch (error) {
        console.error('Error fetching appointments:', error)
        addToast("Erro ao carregar agendamentos", "error")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }, [user, authLoading])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getPetEmoji = (species: string) => {
    const emojis: Record<string, string> = {
      cachorro: "🐕",
      gato: "🐈",
      outro: "🐾",
    }
    return emojis[species] || "🐾"
  }

  const handleCancelAppointment = async () => {
    if (!cancellingAppointment || !user) return

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' } as never)
        .eq('id', cancellingAppointment.id)
        .eq('user_id', user.id)

      if (error) throw error

      setAppointments(
        appointments.map((a) =>
          a.id === cancellingAppointment.id ? { ...a, status: "cancelled" as const } : a
        )
      )
      addToast("Agendamento cancelado", "success")
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      addToast("Erro ao cancelar agendamento", "error")
    } finally {
      setIsCancelModalOpen(false)
      setCancellingAppointment(null)
    }
  }

  const handleOpenCancelModal = (appointment: Appointment) => {
    setCancellingAppointment(appointment)
    setIsCancelModalOpen(true)
  }

  const handleOpenDeleteModal = (appointment: Appointment) => {
    setDeletingAppointment(appointment)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteAppointment = async () => {
    if (!deletingAppointment || !user) return

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', deletingAppointment.id)
        .eq('user_id', user.id)

      if (error) throw error

      setAppointments(appointments.filter((a) => a.id !== deletingAppointment.id))
      addToast("Agendamento excluído", "success")
    } catch (error) {
      console.error('Error deleting appointment:', error)
      addToast("Erro ao excluir agendamento", "error")
    } finally {
      setIsDeleteModalOpen(false)
      setDeletingAppointment(null)
    }
  }

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  )
  const pastAppointments = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  )

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: '16px' }}>
        <div>
          <h1 className="text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
            Agendamentos
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Visualize e gerencie seus agendamentos de serviços
          </p>
        </div>
        <Link href="/appointments/new">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus className="h-5 w-5" />
            Novo Agendamento
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {(isLoading || authLoading) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border animate-pulse"
              style={{
                padding: '16px 20px',
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
              }}
            >
              <div className="flex items-center" style={{ gap: '16px' }}>
                <div className="h-14 w-14 rounded-xl" style={{ background: 'var(--bg-tertiary)' }} />
                <div className="flex-1">
                  <div className="h-5 w-24 rounded" style={{ background: 'var(--bg-tertiary)', marginBottom: '8px' }} />
                  <div className="h-4 w-32 rounded" style={{ background: 'var(--bg-tertiary)' }} />
                </div>
                <div className="h-5 w-20 rounded" style={{ background: 'var(--bg-tertiary)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Appointments Section */}
      {!isLoading && !authLoading && upcomingAppointments.length > 0 && (
        <div>
          <div className="flex items-center" style={{ gap: '12px', marginBottom: '16px' }}>
            <Sparkles className="h-5 w-5" style={{ color: 'var(--accent-yellow)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Próximos Agendamentos
            </h2>
            <span
              className="ml-auto text-sm font-semibold rounded-full"
              style={{
                padding: '4px 12px',
                background: 'var(--accent-purple-bg)',
                color: 'var(--accent-purple)'
              }}
            >
              {upcomingAppointments.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl border group hover:shadow-lg transition-all duration-200"
                style={{
                  padding: '20px',
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)',
                  boxShadow: 'var(--shadow-md)',
                  borderLeftWidth: '4px',
                  borderLeftColor: appointment.status === 'confirmed' ? 'var(--accent-green)' : 'var(--accent-yellow)'
                }}
              >
                {/* Main Row */}
                <div className="flex" style={{ gap: '16px' }}>
                  {/* Pet Avatar - centered vertically */}
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-xl flex-shrink-0 shadow-lg shadow-purple-400/20">
                      {getPetEmoji(appointment.pet?.species || 'outro')}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap" style={{ gap: '8px', marginBottom: '4px' }}>
                      <p className="font-bold text-[16px]" style={{ color: 'var(--text-primary)' }}>
                        {appointment.pet?.name || 'Pet'}
                      </p>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <p className="text-[14px]" style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {appointment.service?.name || 'Serviço'}
                    </p>

                    {/* Date, Time & Price Row */}
                    <div className="flex items-center flex-wrap" style={{ gap: '16px' }}>
                      <div className="flex items-center text-[13px]" style={{ gap: '6px', color: 'var(--text-muted)' }}>
                        <Calendar className="h-4 w-4" style={{ color: 'var(--accent-purple)' }} />
                        <span className="font-medium">{formatDate(appointment.scheduled_date)}</span>
                      </div>
                      <div className="flex items-center text-[13px]" style={{ gap: '6px', color: 'var(--text-muted)' }}>
                        <Clock className="h-4 w-4" style={{ color: 'var(--accent-purple-light)' }} />
                        <span className="font-medium">{appointment.scheduled_time}</span>
                      </div>
                      <div className="font-bold text-[15px]" style={{ color: 'var(--accent-green)' }}>
                        {formatCurrency(appointment.service?.base_price || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions - centered vertically */}
                  <div className="flex items-center flex-shrink-0" style={{ gap: '8px' }}>
                    <button
                      onClick={() => handleOpenCancelModal(appointment)}
                      className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 border hover:bg-amber-50 dark:hover:bg-amber-950"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--accent-yellow)'
                      }}
                      title="Cancelar agendamento"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(appointment)}
                      className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 border hover:bg-red-50 dark:hover:bg-red-950"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--accent-red)'
                      }}
                      title="Excluir agendamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Upcoming */}
      {!isLoading && !authLoading && upcomingAppointments.length === 0 && pastAppointments.length === 0 && (
        <div
          className="rounded-2xl border text-center transition-colors duration-200"
          style={{
            padding: '48px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center mx-auto"
            style={{ marginBottom: '20px', background: 'var(--accent-purple-bg)' }}
          >
            <Calendar className="h-8 w-8" style={{ color: 'var(--accent-purple)' }} />
          </div>
          <h3 className="text-[16px] font-semibold" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
            Nenhum agendamento
          </h3>
          <p className="text-[14px] max-w-sm mx-auto" style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
            Você ainda não tem agendamentos. Agende seu primeiro serviço agora!
          </p>
          <Link href="/appointments/new">
            <Button>
              <Plus className="h-4 w-4" />
              Agendar Agora
            </Button>
          </Link>
        </div>
      )}

      {/* History Section */}
      {!isLoading && !authLoading && pastAppointments.length > 0 && (
        <div>
          <div className="flex items-center" style={{ gap: '12px', marginBottom: '16px' }}>
            <CheckCircle className="h-5 w-5" style={{ color: 'var(--accent-blue)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Histórico
            </h2>
            <span
              className="ml-auto text-sm font-semibold rounded-full"
              style={{
                padding: '4px 12px',
                background: 'var(--accent-blue-bg)',
                color: 'var(--accent-blue)'
              }}
            >
              {pastAppointments.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pastAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl border transition-colors duration-200"
                style={{
                  padding: '16px 20px',
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: 0.85
                }}
              >
                <div className="flex items-center" style={{ gap: '16px' }}>
                  {/* Pet Avatar */}
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    {getPetEmoji(appointment.pet?.species || 'outro')}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap" style={{ gap: '8px', marginBottom: '4px' }}>
                      <p className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
                        {appointment.pet?.name || 'Pet'}
                      </p>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <p className="text-[13px]" style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {appointment.service?.name || 'Serviço'}
                    </p>

                    {/* Date & Price Row */}
                    <div className="flex items-center flex-wrap" style={{ gap: '12px' }}>
                      <div className="flex items-center text-[12px]" style={{ gap: '4px', color: 'var(--text-muted)' }}>
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(appointment.scheduled_date)}</span>
                      </div>
                      <div className="font-semibold text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(appointment.service?.base_price || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button - only for cancelled appointments */}
                  {appointment.status === 'cancelled' && (
                    <button
                      onClick={() => handleOpenDeleteModal(appointment)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 border hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--accent-red)'
                      }}
                      title="Excluir agendamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Agendamento"
      >
        <div className="flex items-start" style={{ gap: '12px' }}>
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-red-bg)' }}
          >
            <AlertCircle className="h-5 w-5" style={{ color: 'var(--accent-red)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--text-primary)' }}>
              Tem certeza que deseja cancelar o agendamento de{" "}
              <strong>{cancellingAppointment?.pet.name}</strong> para{" "}
              <strong>{cancellingAppointment?.service.name}</strong>?
            </p>
            <p className="text-sm" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
              Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        <ModalActions>
          <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
            Manter agendamento
          </Button>
          <Button variant="destructive" onClick={handleCancelAppointment}>
            Cancelar agendamento
          </Button>
        </ModalActions>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Agendamento"
      >
        <div className="flex items-start" style={{ gap: '12px' }}>
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-red-bg)' }}
          >
            <Trash2 className="h-5 w-5" style={{ color: 'var(--accent-red)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--text-primary)' }}>
              Tem certeza que deseja excluir permanentemente o agendamento de{" "}
              <strong>{deletingAppointment?.pet?.name}</strong> para{" "}
              <strong>{deletingAppointment?.service?.name}</strong>?
            </p>
            <p className="text-sm" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
              Esta ação não pode ser desfeita e o registro será removido permanentemente.
            </p>
          </div>
        </div>
        <ModalActions>
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
            Manter
          </Button>
          <Button variant="destructive" onClick={handleDeleteAppointment}>
            Excluir permanentemente
          </Button>
        </ModalActions>
      </Modal>
    </div>
  )
}
