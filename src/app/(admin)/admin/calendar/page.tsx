"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalActions } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import {
  getCalendarAppointmentsClient,
  updateAppointmentStatusClient,
  blockSlotClient,
} from "@/lib/queries/admin-client"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  PawPrint,
  User,
  Phone,
  Calendar,
  Plus,
  CalendarDays,
  RefreshCw,
} from "lucide-react"

interface CalendarAppointment {
  id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  user: { id: string; name: string | null; phone: string | null } | null
  pet: { id: string; name: string; species: string } | null
  service: { id: string; name: string } | null
}

interface TimeSlot {
  time: string
  available: boolean
  appointment?: CalendarAppointment
}

export default function AdminCalendarPage() {
  const { addToast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "day">("week")
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [selectedDateForBlock, setSelectedDateForBlock] = useState<Date | null>(null)
  const [selectedTimeForBlock, setSelectedTimeForBlock] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBlocking, setIsBlocking] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([])

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ]

  const getWeekDays = (date: Date): Date[] => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)

    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  }

  const formatDateKey = (date: Date): string => {
    // Use local date format YYYY-MM-DD to match database
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const weekDays = getWeekDays(currentDate)

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true)
      const days = getWeekDays(currentDate)
      const startDate = viewMode === "week"
        ? formatDateKey(days[0])
        : formatDateKey(currentDate)
      const endDate = viewMode === "week"
        ? formatDateKey(days[6])
        : formatDateKey(currentDate)

      console.log('Fetching appointments:', { startDate, endDate })
      const data = await getCalendarAppointmentsClient(startDate, endDate)
      console.log('Appointments loaded:', data)
      setAppointments(data)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      addToast("Erro ao carregar agenda", "error")
    } finally {
      setIsLoading(false)
    }
  }, [currentDate, viewMode, addToast])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const formatDayName = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", { weekday: "short" })
  }

  const formatDayNumber = (date: Date): string => {
    return date.getDate().toString()
  }

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getSlotStatus = (date: Date, time: string): TimeSlot => {
    const dateKey = formatDateKey(date)
    const appointment = appointments.find(apt => {
      // Compare date
      const dateMatch = apt.scheduled_date === dateKey
      // Compare time - handle different formats (HH:MM:SS or HH:MM)
      const aptTime = apt.scheduled_time?.slice(0, 5)
      const timeMatch = aptTime === time
      return dateMatch && timeMatch
    })

    return {
      time,
      available: !appointment,
      appointment,
    }
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + direction)
    setCurrentDate(newDate)
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "confirmed":
        return "Confirmado"
      case "completed":
        return "Concluído"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const getStatusVariant = (status: string): "warning" | "info" | "success" | "error" => {
    switch (status) {
      case "pending":
        return "warning"
      case "confirmed":
        return "info"
      case "completed":
        return "success"
      case "cancelled":
        return "error"
      default:
        return "info"
    }
  }

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    try {
      setIsUpdating(true)
      await updateAppointmentStatusClient(id, newStatus)

      // Update local state
      setAppointments(appointments.map((apt) =>
        apt.id === id ? { ...apt, status: newStatus } : apt
      ))

      // Update selected slot if it's the one being changed
      if (selectedSlot?.appointment?.id === id) {
        setSelectedSlot({
          ...selectedSlot,
          appointment: { ...selectedSlot.appointment, status: newStatus }
        })
      }

      const messages = {
        confirmed: "Agendamento confirmado!",
        completed: "Agendamento concluído!",
        cancelled: "Agendamento cancelado!",
        pending: "Agendamento atualizado!",
      }
      addToast(messages[newStatus], "success")
      setSelectedSlot(null)
    } catch (error) {
      console.error('Error updating appointment status:', error)
      addToast("Erro ao atualizar agendamento", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBlockSlot = async () => {
    if (!selectedDateForBlock || !selectedTimeForBlock) return

    setIsBlocking(true)
    try {
      const dateKey = formatDateKey(selectedDateForBlock)
      // Calculate end time (1 hour slot)
      const [hours, minutes] = selectedTimeForBlock.split(':').map(Number)
      const endHours = hours + 1
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

      await blockSlotClient(dateKey, selectedTimeForBlock, endTime, 'Bloqueado pelo administrador')
      addToast("Horário bloqueado com sucesso!", "success")
      setIsBlockModalOpen(false)
      setSelectedDateForBlock(null)
      setSelectedTimeForBlock(null)
      // Refresh appointments to update the view
      fetchAppointments()
    } catch (error) {
      console.error('Error blocking slot:', error)
      addToast("Erro ao bloquear horário", "error")
    } finally {
      setIsBlocking(false)
    }
  }

  // Loading skeleton
  if (isLoading && appointments.length === 0) {
    return (
      <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: '16px' }}>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30 flex-shrink-0">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[1.5rem] sm:text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
                Agenda
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Visualize e gerencie sua agenda de atendimentos
              </p>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        <div
          className="rounded-2xl border animate-pulse"
          style={{
            height: '72px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        />
        <div
          className="rounded-2xl border animate-pulse"
          style={{
            height: '500px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: '16px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-400/30 flex-shrink-0">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[1.5rem] sm:text-[1.75rem] font-bold" style={{ color: 'var(--text-primary)' }}>
              Agenda
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Visualize e gerencie sua agenda de atendimentos
            </p>
          </div>
        </div>

        <div className="flex items-center" style={{ gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={fetchAppointments} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant={viewMode === "day" ? "default" : "secondary"}
            size="sm"
            onClick={() => setViewMode("day")}
          >
            Dia
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "secondary"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Semana
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div
        className="rounded-2xl border"
        style={{
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => viewMode === "week" ? navigateWeek(-1) : navigateDay(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <p className="text-lg font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
              {formatMonthYear(currentDate)}
            </p>
            {viewMode === "day" && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric" })}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => viewMode === "week" ? navigateWeek(1) : navigateDay(1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div className="overflow-x-auto">
          {viewMode === "week" ? (
            <div style={{ minWidth: '800px' }}>
              {/* Week Header */}
              <div
                className="grid grid-cols-8 border-b"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <div
                  className="p-4 text-center text-sm font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Horário
                </div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="p-4 text-center border-l"
                    style={{
                      borderColor: 'var(--border-primary)',
                      background: isToday(day) ? 'var(--accent-purple-bg)' : 'transparent'
                    }}
                  >
                    <p className="text-sm capitalize" style={{ color: 'var(--text-muted)' }}>
                      {formatDayName(day)}
                    </p>
                    <p
                      className="text-lg font-semibold"
                      style={{ color: isToday(day) ? 'var(--accent-purple)' : 'var(--text-primary)' }}
                    >
                      {formatDayNumber(day)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-8 border-b"
                  style={{ borderColor: 'var(--border-secondary)' }}
                >
                  <div
                    className="p-4 text-center text-sm flex items-center justify-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {time}
                  </div>
                  {weekDays.map((day) => {
                    const slot = getSlotStatus(day, time)

                    return (
                      <div
                        key={`${day.toISOString()}-${time}`}
                        className="p-2 border-l"
                        style={{
                          minHeight: '80px',
                          borderColor: 'var(--border-primary)',
                          background: isToday(day)
                            ? 'rgba(124, 58, 237, 0.03)'
                            : 'transparent'
                        }}
                      >
                        {slot.appointment ? (
                          <div
                            className="h-full rounded-xl cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4"
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: '8px 10px',
                              background: slot.appointment.status === 'pending'
                                ? 'var(--accent-yellow-bg)'
                                : slot.appointment.status === 'confirmed'
                                ? 'var(--accent-blue-bg)'
                                : slot.appointment.status === 'completed'
                                ? 'var(--accent-green-bg)'
                                : 'var(--accent-red-bg)',
                              borderLeftColor: slot.appointment.status === 'pending'
                                ? 'var(--accent-yellow)'
                                : slot.appointment.status === 'confirmed'
                                ? 'var(--accent-blue)'
                                : slot.appointment.status === 'completed'
                                ? 'var(--accent-green)'
                                : 'var(--accent-red)',
                            }}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <PawPrint
                                className="h-3 w-3 flex-shrink-0"
                                style={{
                                  color: slot.appointment.status === 'pending'
                                    ? 'var(--accent-yellow)'
                                    : slot.appointment.status === 'confirmed'
                                    ? 'var(--accent-blue)'
                                    : slot.appointment.status === 'completed'
                                    ? 'var(--accent-green)'
                                    : 'var(--accent-red)'
                                }}
                              />
                              <p
                                className="text-xs font-bold truncate"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {slot.appointment.pet?.name || 'Pet'}
                              </p>
                            </div>
                            <p
                              className="text-[10px] truncate"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {slot.appointment.user?.name || 'Cliente'}
                            </p>
                            <div
                              className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium inline-block"
                              style={{
                                background: 'var(--bg-primary)',
                                color: slot.appointment.status === 'pending'
                                  ? 'var(--accent-yellow)'
                                  : slot.appointment.status === 'confirmed'
                                  ? 'var(--accent-blue)'
                                  : slot.appointment.status === 'completed'
                                  ? 'var(--accent-green)'
                                  : 'var(--accent-red)'
                              }}
                            >
                              {slot.appointment.service?.name || 'Serviço'}
                            </div>
                          </div>
                        ) : (
                          <button
                            className="w-full h-full min-h-[60px] rounded-lg border-2 border-dashed transition-colors flex items-center justify-center"
                            style={{
                              borderColor: 'transparent',
                              background: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--accent-purple)'
                              e.currentTarget.style.background = 'var(--accent-purple-bg)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'transparent'
                              e.currentTarget.style.background = 'transparent'
                            }}
                            onClick={() => {
                              setSelectedDateForBlock(day)
                              setSelectedTimeForBlock(time)
                              setIsBlockModalOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ) : (
            /* Day View */
            <div>
              {timeSlots.map((time) => {
                const slot = getSlotStatus(currentDate, time)

                return (
                  <div
                    key={time}
                    className="flex items-stretch border-b"
                    style={{ minHeight: '100px', borderColor: 'var(--border-primary)' }}
                  >
                    <div
                      className="w-20 p-4 flex items-center justify-center text-sm border-r"
                      style={{
                        color: 'var(--text-muted)',
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)'
                      }}
                    >
                      {time}
                    </div>
                    <div className="flex-1" style={{ padding: '12px' }}>
                      {slot.appointment ? (
                        <div
                          className="rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] border-l-4"
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: '16px',
                            background: slot.appointment.status === 'pending'
                              ? 'var(--accent-yellow-bg)'
                              : slot.appointment.status === 'confirmed'
                              ? 'var(--accent-blue-bg)'
                              : slot.appointment.status === 'completed'
                              ? 'var(--accent-green-bg)'
                              : 'var(--accent-red-bg)',
                            borderLeftColor: slot.appointment.status === 'pending'
                              ? 'var(--accent-yellow)'
                              : slot.appointment.status === 'confirmed'
                              ? 'var(--accent-blue)'
                              : slot.appointment.status === 'completed'
                              ? 'var(--accent-green)'
                              : 'var(--accent-red)',
                          }}
                        >
                          <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
                            <div className="flex items-center gap-3">
                              <div
                                className="h-10 w-10 rounded-xl flex items-center justify-center"
                                style={{
                                  background: slot.appointment.status === 'pending'
                                    ? 'var(--accent-yellow)'
                                    : slot.appointment.status === 'confirmed'
                                    ? 'var(--accent-blue)'
                                    : slot.appointment.status === 'completed'
                                    ? 'var(--accent-green)'
                                    : 'var(--accent-red)',
                                }}
                              >
                                <PawPrint className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                  {slot.appointment.pet?.name || 'Pet'}
                                </p>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                  {slot.appointment.user?.name || 'Cliente'}
                                </p>
                              </div>
                            </div>
                            <Badge variant={getStatusVariant(slot.appointment.status)}>
                              {getStatusLabel(slot.appointment.status)}
                            </Badge>
                          </div>
                          <div
                            className="flex items-center gap-2 px-3 py-2 rounded-lg"
                            style={{ background: 'var(--bg-primary)' }}
                          >
                            <Clock
                              className="h-4 w-4"
                              style={{
                                color: slot.appointment.status === 'pending'
                                  ? 'var(--accent-yellow)'
                                  : slot.appointment.status === 'confirmed'
                                  ? 'var(--accent-blue)'
                                  : slot.appointment.status === 'completed'
                                  ? 'var(--accent-green)'
                                  : 'var(--accent-red)'
                              }}
                            />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {slot.appointment.service?.name || 'Serviço'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="w-full h-full min-h-[80px] rounded-xl border-2 border-dashed flex items-center justify-center transition-colors"
                          style={{
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-muted)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-purple)'
                            e.currentTarget.style.background = 'var(--accent-purple-bg)'
                            e.currentTarget.style.color = 'var(--accent-purple)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-primary)'
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'var(--text-muted)'
                          }}
                          onClick={() => {
                            setSelectedDateForBlock(currentDate)
                            setSelectedTimeForBlock(time)
                            setIsBlockModalOpen(true)
                          }}
                        >
                          <Plus className="h-5 w-5" />
                          <span style={{ marginLeft: '8px' }}>Bloquear horário</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={!!selectedSlot?.appointment}
        onClose={() => setSelectedSlot(null)}
        title="Detalhes do Agendamento"
      >
        {selectedSlot?.appointment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex items-center justify-between">
              <Badge variant={getStatusVariant(selectedSlot.appointment.status)}>
                {getStatusLabel(selectedSlot.appointment.status)}
              </Badge>
              <span className="text-sm flex items-center" style={{ gap: '4px', color: 'var(--text-muted)' }}>
                <Clock className="h-4 w-4" />
                {selectedSlot.time}
              </span>
            </div>

            <div
              className="border-y"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px 0',
                borderColor: 'var(--border-primary)'
              }}
            >
              <div className="flex items-center" style={{ gap: '12px' }}>
                <User className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cliente</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedSlot.appointment.user?.name || 'Cliente'}
                  </p>
                </div>
              </div>

              <div className="flex items-center" style={{ gap: '12px' }}>
                <Phone className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Telefone</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedSlot.appointment.user?.phone || 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center" style={{ gap: '12px' }}>
                <PawPrint className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pet</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedSlot.appointment.pet?.name || 'Pet'} ({selectedSlot.appointment.pet?.species || '-'})
                  </p>
                </div>
              </div>

              <div className="flex items-center" style={{ gap: '12px' }}>
                <Calendar className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Serviço</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedSlot.appointment.service?.name || 'Serviço'}
                  </p>
                </div>
              </div>
            </div>

            <ModalActions>
              {selectedSlot.appointment.status === "pending" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusChange(selectedSlot.appointment!.id, 'cancelled')}
                    disabled={isUpdating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(selectedSlot.appointment!.id, 'confirmed')}
                    disabled={isUpdating}
                  >
                    Confirmar
                  </Button>
                </>
              )}
              {selectedSlot.appointment.status === "confirmed" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusChange(selectedSlot.appointment!.id, 'cancelled')}
                    disabled={isUpdating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(selectedSlot.appointment!.id, 'completed')}
                    disabled={isUpdating}
                  >
                    Concluir
                  </Button>
                </>
              )}
              {(selectedSlot.appointment.status === "completed" || selectedSlot.appointment.status === "cancelled") && (
                <Button variant="secondary" onClick={() => setSelectedSlot(null)}>
                  Fechar
                </Button>
              )}
            </ModalActions>
          </div>
        )}
      </Modal>

      {/* Block Slot Modal */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => {
          setIsBlockModalOpen(false)
          setSelectedDateForBlock(null)
          setSelectedTimeForBlock(null)
        }}
        title="Bloquear Horário"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {selectedDateForBlock && selectedTimeForBlock && (
            <div
              className="rounded-xl"
              style={{
                padding: '12px 16px',
                background: 'var(--accent-purple-bg)',
                color: 'var(--accent-purple)',
                fontWeight: 500
              }}
            >
              {selectedDateForBlock.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {selectedTimeForBlock}
            </div>
          )}
          <p style={{ color: 'var(--text-muted)' }}>
            Deseja bloquear este horário? Ele ficará indisponível para novos agendamentos.
          </p>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={() => {
            setIsBlockModalOpen(false)
            setSelectedDateForBlock(null)
            setSelectedTimeForBlock(null)
          }}>
            Cancelar
          </Button>
          <Button onClick={handleBlockSlot} isLoading={isBlocking}>
            Bloquear
          </Button>
        </ModalActions>
      </Modal>
    </div>
  )
}
