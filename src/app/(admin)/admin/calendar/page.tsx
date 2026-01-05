"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalActions } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import {
  getCalendarAppointmentsClient,
  updateAppointmentStatusClient,
  blockSlotClient,
  unblockSlotClient,
  getBlockedSlotsClient,
  getSettingsClient,
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
  blocked: boolean
  appointment?: CalendarAppointment
  appointments: CalendarAppointment[]
}

interface DaySchedule {
  enabled: boolean
  start: string
  end: string
}

interface WeekSchedule {
  [key: string]: DaySchedule
}

const defaultSchedule: WeekSchedule = {
  "0": { enabled: true, start: "08:00", end: "21:00" },
  "1": { enabled: true, start: "08:00", end: "21:00" },
  "2": { enabled: true, start: "18:00", end: "21:00" },
  "3": { enabled: true, start: "18:00", end: "21:00" },
  "4": { enabled: true, start: "18:00", end: "21:00" },
  "5": { enabled: true, start: "18:00", end: "21:00" },
  "6": { enabled: true, start: "18:00", end: "21:00" },
}

const CALENDAR_VIEW_KEY = 'petcare-calendar-view'

export default function AdminCalendarPage() {
  const { addToast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "day">(() => {
    // Load from localStorage on initial render (client-side only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CALENDAR_VIEW_KEY)
      if (saved === 'day' || saved === 'week') {
        return saved
      }
    }
    return "week"
  })
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [selectedDateForBlock, setSelectedDateForBlock] = useState<Date | null>(null)
  const [selectedTimeForBlock, setSelectedTimeForBlock] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBlocking, setIsBlocking] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([])
  const [blockedSlots, setBlockedSlots] = useState<{ date: string; start_time: string; id: string }[]>([])
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule)
  const [slotDuration, setSlotDuration] = useState(60)

  const formatDateKey = (date: Date): string => {
    // Use local date format YYYY-MM-DD to match database
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Generate time slots based on schedule for current day (memoized for day view)
  const dayViewTimeSlots = useMemo((): string[] => {
    const dayOfWeek = currentDate.getDay().toString()
    const daySchedule = schedule[dayOfWeek]
    const dateKey = formatDateKey(currentDate)
    const slotsSet = new Set<string>()

    // Add slots from schedule
    if (daySchedule && daySchedule.enabled) {
      const [startHour, startMin] = daySchedule.start.split(':').map(Number)
      const [endHour, endMin] = daySchedule.end.split(':').map(Number)

      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin

      for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
        const hour = Math.floor(minutes / 60)
        const min = minutes % 60
        slotsSet.add(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
      }
    }

    // Also include times from existing appointments for this day
    appointments.forEach(apt => {
      if (apt.scheduled_date === dateKey && apt.scheduled_time) {
        const time = apt.scheduled_time.slice(0, 5)
        slotsSet.add(time)
      }
    })

    return Array.from(slotsSet).sort()
  }, [currentDate, schedule, slotDuration, appointments])

  // Get all unique time slots for the week view (memoized to avoid recalculation)
  const allTimeSlots = useMemo((): string[] => {
    const allSlots = new Set<string>()

    // Get slots from schedule for all days of the week
    for (let i = 0; i < 7; i++) {
      const daySchedule = schedule[i.toString()]
      if (daySchedule && daySchedule.enabled) {
        const [startHour, startMin] = daySchedule.start.split(':').map(Number)
        const [endHour, endMin] = daySchedule.end.split(':').map(Number)

        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin

        for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
          const hour = Math.floor(minutes / 60)
          const min = minutes % 60
          allSlots.add(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
        }
      }
    }

    // Also include times from existing appointments (even if outside schedule)
    appointments.forEach(apt => {
      if (apt.scheduled_time) {
        const time = apt.scheduled_time.slice(0, 5)
        allSlots.add(time)
      }
    })

    return Array.from(allSlots).sort()
  }, [schedule, slotDuration, appointments])

  // Check if a day is enabled
  const isDayEnabled = useCallback((date: Date): boolean => {
    const dayOfWeek = date.getDay().toString()
    return schedule[dayOfWeek]?.enabled ?? false
  }, [schedule])

  // Check if a time slot is available for a specific day
  const isSlotInSchedule = useCallback((date: Date, time: string): boolean => {
    const dayOfWeek = date.getDay().toString()
    const daySchedule = schedule[dayOfWeek]

    if (!daySchedule || !daySchedule.enabled) {
      return false
    }

    const [slotHour, slotMin] = time.split(':').map(Number)
    const [startHour, startMin] = daySchedule.start.split(':').map(Number)
    const [endHour, endMin] = daySchedule.end.split(':').map(Number)

    const slotMinutes = slotHour * 60 + slotMin
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    return slotMinutes >= startMinutes && slotMinutes < endMinutes
  }, [schedule])

  // Check if a slot is blocked and get its ID
  const getBlockedSlotId = useCallback((date: Date, time: string): string | null => {
    const dateKey = formatDateKey(date)
    const blocked = blockedSlots.find(slot =>
      slot.date === dateKey && slot.start_time.slice(0, 5) === time
    )
    return blocked?.id || null
  }, [blockedSlots])

  // Check if a slot is blocked
  const isSlotBlocked = useCallback((date: Date, time: string): boolean => {
    return getBlockedSlotId(date, time) !== null
  }, [getBlockedSlotId])

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

  const weekDays = getWeekDays(currentDate)

  const fetchSettings = useCallback(async () => {
    try {
      const settings = await getSettingsClient()
      const businessHours = settings.business_hours as { schedule?: WeekSchedule } | undefined

      if (businessHours?.schedule) {
        setSchedule(businessHours.schedule)
      }

      if (settings.slot_duration) {
        setSlotDuration(Number(settings.slot_duration))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }, [])

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

      const [appointmentsData, blockedData] = await Promise.all([
        getCalendarAppointmentsClient(startDate, endDate),
        getBlockedSlotsClient(startDate, endDate)
      ])
      setAppointments(appointmentsData)
      setBlockedSlots(blockedData)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      addToast("Erro ao carregar agenda", "error")
    } finally {
      setIsLoading(false)
    }
  }, [currentDate, viewMode, addToast])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

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
    const slotAppointments = appointments.filter(apt => {
      // Compare date
      const dateMatch = apt.scheduled_date === dateKey
      // Compare time - handle different formats (HH:MM:SS or HH:MM)
      const aptTime = apt.scheduled_time?.slice(0, 5)
      const timeMatch = aptTime === time
      return dateMatch && timeMatch
    })

    const blocked = isSlotBlocked(date, time)

    return {
      time,
      available: slotAppointments.length === 0 && !blocked,
      blocked,
      appointment: slotAppointments[0], // Keep for backwards compatibility
      appointments: slotAppointments,
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

  const handleUnblockSlot = async (slotId: string) => {
    setIsBlocking(true)
    try {
      await unblockSlotClient(slotId)
      addToast("Horário desbloqueado com sucesso!", "success")
      // Refresh to update the view
      fetchAppointments()
    } catch (error) {
      console.error('Error unblocking slot:', error)
      addToast("Erro ao desbloquear horário", "error")
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
            onClick={() => {
              setViewMode("day")
              localStorage.setItem(CALENDAR_VIEW_KEY, "day")
            }}
          >
            Dia
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "secondary"}
            size="sm"
            onClick={() => {
              setViewMode("week")
              localStorage.setItem(CALENDAR_VIEW_KEY, "week")
            }}
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
              {allTimeSlots.map((time: string) => (
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
                        className="p-1 border-l flex flex-col"
                        style={{
                          minHeight: '80px',
                          gap: '4px',
                          borderColor: 'var(--border-primary)',
                          background: isToday(day)
                            ? 'rgba(124, 58, 237, 0.03)'
                            : 'transparent'
                        }}
                      >
                        {slot.appointments.length > 0 ? (
                          <>
                            {slot.appointments.map((apt) => (
                              <div
                                key={apt.id}
                                className="rounded-lg cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-l-[3px]"
                                onClick={() => {
                                  setSelectedSlot({ ...slot, appointment: apt })
                                }}
                                style={{
                                  padding: '4px 6px',
                                  background: apt.status === 'pending'
                                    ? 'var(--accent-yellow-bg)'
                                    : apt.status === 'confirmed'
                                    ? 'var(--accent-blue-bg)'
                                    : apt.status === 'completed'
                                    ? 'var(--accent-green-bg)'
                                    : 'var(--accent-red-bg)',
                                  borderLeftColor: apt.status === 'pending'
                                    ? 'var(--accent-yellow)'
                                    : apt.status === 'confirmed'
                                    ? 'var(--accent-blue)'
                                    : apt.status === 'completed'
                                    ? 'var(--accent-green)'
                                    : 'var(--accent-red)',
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  <PawPrint
                                    className="h-2.5 w-2.5 flex-shrink-0"
                                    style={{
                                      color: apt.status === 'pending'
                                        ? 'var(--accent-yellow)'
                                        : apt.status === 'confirmed'
                                        ? 'var(--accent-blue)'
                                        : apt.status === 'completed'
                                        ? 'var(--accent-green)'
                                        : 'var(--accent-red)'
                                    }}
                                  />
                                  <p
                                    className="text-[10px] font-semibold truncate"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {apt.pet?.name || 'Pet'}
                                  </p>
                                </div>
                                <p
                                  className="text-[9px] truncate"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {apt.service?.name || 'Serviço'}
                                </p>
                              </div>
                            ))}
                          </>
                        ) : slot.blocked ? (
                          <button
                            className="w-full h-full min-h-[60px] rounded-lg flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer hover:opacity-100"
                            style={{
                              background: 'var(--bg-tertiary)',
                              opacity: 0.6
                            }}
                            onClick={() => {
                              const slotId = getBlockedSlotId(day, time)
                              if (slotId) handleUnblockSlot(slotId)
                            }}
                            disabled={isBlocking}
                          >
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Bloqueado</span>
                            <span className="text-[9px] underline" style={{ color: 'var(--accent-purple)' }}>Desbloquear</span>
                          </button>
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
              {dayViewTimeSlots.map((time: string) => {
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
                    <div className="flex-1 flex flex-col" style={{ padding: '12px', gap: '8px' }}>
                      {slot.appointments.length > 0 ? (
                        <>
                          {slot.appointments.map((apt) => (
                            <div
                              key={apt.id}
                              className="rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] border-l-4"
                              onClick={() => setSelectedSlot({ ...slot, appointment: apt })}
                              style={{
                                padding: '16px',
                                background: apt.status === 'pending'
                                  ? 'var(--accent-yellow-bg)'
                                  : apt.status === 'confirmed'
                                  ? 'var(--accent-blue-bg)'
                                  : apt.status === 'completed'
                                  ? 'var(--accent-green-bg)'
                                  : 'var(--accent-red-bg)',
                                borderLeftColor: apt.status === 'pending'
                                  ? 'var(--accent-yellow)'
                                  : apt.status === 'confirmed'
                                  ? 'var(--accent-blue)'
                                  : apt.status === 'completed'
                                  ? 'var(--accent-green)'
                                  : 'var(--accent-red)',
                              }}
                            >
                              <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
                                <div className="flex items-center gap-3">
                                  <div
                                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                                    style={{
                                      background: apt.status === 'pending'
                                        ? 'var(--accent-yellow)'
                                        : apt.status === 'confirmed'
                                        ? 'var(--accent-blue)'
                                        : apt.status === 'completed'
                                        ? 'var(--accent-green)'
                                        : 'var(--accent-red)',
                                    }}
                                  >
                                    <PawPrint className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                      {apt.pet?.name || 'Pet'}
                                    </p>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                      {apt.user?.name || 'Cliente'}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={getStatusVariant(apt.status)}>
                                  {getStatusLabel(apt.status)}
                                </Badge>
                              </div>
                              <div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                style={{ background: 'var(--bg-primary)' }}
                              >
                                <Clock
                                  className="h-4 w-4"
                                  style={{
                                    color: apt.status === 'pending'
                                      ? 'var(--accent-yellow)'
                                      : apt.status === 'confirmed'
                                      ? 'var(--accent-blue)'
                                      : apt.status === 'completed'
                                      ? 'var(--accent-green)'
                                      : 'var(--accent-red)'
                                  }}
                                />
                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {apt.service?.name || 'Serviço'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : slot.blocked ? (
                        <button
                          className="w-full h-full min-h-[80px] rounded-xl flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer hover:opacity-100"
                          style={{
                            background: 'var(--bg-tertiary)',
                            opacity: 0.6
                          }}
                          onClick={() => {
                            const slotId = getBlockedSlotId(currentDate, time)
                            if (slotId) handleUnblockSlot(slotId)
                          }}
                          disabled={isBlocking}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Horário bloqueado</span>
                          <span className="text-sm underline" style={{ color: 'var(--accent-purple)' }}>Clique para desbloquear</span>
                        </button>
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
