"use client"

import { FaCalendar, FaClock } from "react-icons/fa"
import { cn } from "@/lib/utils"
import { IconButton, StatusBadge } from "@/components/ui"

interface Appointment {
  id: string
  pet: {
    name: string
    type: string
  }
  service: {
    name: string
  }
  scheduled_date: string
  scheduled_time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  price: number
}

interface AppointmentCardProps {
  appointment: Appointment
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onMore?: (id: string) => void
  variant?: "compact" | "full"
}

const statusConfig = {
  pending: {
    label: "Pendente",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  confirmed: {
    label: "Confirmado",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  completed: {
    label: "Concluído",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  cancelled: {
    label: "Cancelado",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
}

const getPetEmoji = (type: string): string => {
  const emojis: Record<string, string> = {
    Dog: "🐕",
    Cat: "🐈",
    Bird: "🐦",
    Rabbit: "🐰",
  }
  return emojis[type] || "🐾"
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("pt-BR", { weekday: "short", month: "short", day: "numeric" })
}

export function AppointmentCard({
  appointment,
  onEdit,
  onDelete,
  onMore,
  variant = "full",
}: AppointmentCardProps) {
  const config = statusConfig[appointment.status]

  if (variant === "compact") {
    return (
      <div className="glass-card p-4 backdrop-blur-xl border border-white/40 rounded-lg hover:border-white/60 transition-all duration-300">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg flex-shrink-0">
            {getPetEmoji(appointment.pet.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{appointment.pet.name}</p>
            <p className="text-xs text-gray-600 truncate">{appointment.service.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <FaClock className="h-3 w-3" />
              {formatDate(appointment.scheduled_date)}
            </div>
          </div>
          <StatusBadge status={appointment.status} compact />
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5 backdrop-blur-xl border border-white/40 rounded-xl hover:border-white/60 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
      <div className="flex items-start gap-4">
        {/* Pet Avatar */}
        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
          {getPetEmoji(appointment.pet.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="font-bold text-gray-900 text-lg">{appointment.pet.name}</p>
              <p className="text-sm text-gray-600">{appointment.service.name}</p>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          {/* Info Row */}
          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-1.5">
              <FaCalendar className="h-4 w-4 text-purple-500" />
              <span className="font-medium">{formatDate(appointment.scheduled_date)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FaClock className="h-4 w-4 text-pink-500" />
              <span className="font-medium">{appointment.scheduled_time}</span>
            </div>
            <div className="ml-auto font-bold text-gray-900">
              R$ {appointment.price}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col">
          {onEdit && (
            <IconButton
              icon="edit"
              onClick={() => onEdit(appointment.id)}
              label="Remarcar"
              variant="primary"
              size="md"
            />
          )}
          {onDelete && (
            <IconButton
              icon="delete"
              onClick={() => onDelete(appointment.id)}
              label="Cancelar"
              variant="danger"
              size="md"
            />
          )}
          {onMore && (
            <IconButton
              icon="more"
              onClick={() => onMore(appointment.id)}
              label="Mais ações"
              variant="secondary"
              size="md"
            />
          )}
        </div>
      </div>
    </div>
  )
}
