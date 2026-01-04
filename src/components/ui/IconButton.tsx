"use client"

import React from "react"
import { FaPlus, FaEdit, FaTrash, FaCheck, FaClock, FaCalendar } from "react-icons/fa"
import { MdAdd, MdDelete, MdEdit, MdMoreVert } from "react-icons/md"

interface IconButtonProps {
  icon: "add" | "edit" | "delete" | "more"
  onClick: () => void
  label?: string
  variant?: "primary" | "success" | "danger" | "secondary"
  size?: "sm" | "md" | "lg"
  className?: string
}

const iconMap = {
  add: { fa: FaPlus, md: MdAdd },
  edit: { fa: FaEdit, md: MdEdit },
  delete: { fa: FaTrash, md: MdDelete },
  more: { fa: null, md: MdMoreVert },
}

const variantStyles = {
  primary: "text-purple-600 hover:bg-white/40 hover:backdrop-blur-sm",
  success: "text-green-600 hover:bg-white/40 hover:backdrop-blur-sm",
  danger: "text-red-600 hover:bg-white/40 hover:backdrop-blur-sm",
  secondary: "text-gray-600 hover:bg-white/40 hover:backdrop-blur-sm",
}

const sizeStyles = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
}

export function IconButton({
  icon,
  onClick,
  label,
  variant = "primary",
  size = "md",
  className = "",
}: IconButtonProps) {
  const Icon = iconMap[icon].md || iconMap[icon].fa
  const baseClasses = `inline-flex items-center justify-center rounded-lg transition-all duration-200 hover:shadow-md flex-shrink-0`

  return (
    <button
      onClick={onClick}
      title={label}
      className={`${baseClasses} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {Icon && <Icon />}
    </button>
  )
}

interface ActionButtonProps {
  icon: "add" | "edit" | "delete"
  label: string
  onClick: () => void
  variant?: "primary" | "success" | "danger"
  fullWidth?: boolean
}

export function ActionButton({
  icon,
  label,
  onClick,
  variant = "primary",
  fullWidth = false,
}: ActionButtonProps) {
  const Icon = iconMap[icon].fa

  const variantClasses = {
    primary: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white backdrop-blur-sm",
    success: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white backdrop-blur-sm",
    danger: "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white backdrop-blur-sm",
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2
        px-4 py-2.5 rounded-lg font-semibold
        transition-all duration-200 shadow-lg hover:shadow-xl
        ${variantClasses[variant]}
        ${fullWidth ? "w-full" : ""}
      `}
    >
      {Icon && <Icon className="h-5 w-5" />}
      <span>{label}</span>
    </button>
  )
}

interface InfoBadgeProps {
  icon: "calendar" | "clock" | "check"
  label: string
  value: string
  color?: "purple" | "pink" | "green" | "blue"
}

export function InfoBadge({ icon, label, value, color = "purple" }: InfoBadgeProps) {
  const icons = {
    calendar: FaCalendar,
    clock: FaClock,
    check: FaCheck,
  }

  const colorClasses = {
    purple: "text-purple-600",
    pink: "text-pink-600",
    green: "text-green-600",
    blue: "text-blue-600",
  }

  const Icon = icons[icon]

  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
    </div>
  )
}

interface StatusBadgeProps {
  status: "pending" | "confirmed" | "completed" | "cancelled"
  compact?: boolean
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      bg: "bg-white/40 backdrop-blur-sm border border-yellow-100/30",
      text: "text-yellow-700",
      icon: FaClock,
      label: "Pendente",
    },
    confirmed: {
      bg: "bg-white/40 backdrop-blur-sm border border-green-100/30",
      text: "text-green-700",
      icon: FaCheck,
      label: "Confirmado",
    },
    completed: {
      bg: "bg-white/40 backdrop-blur-sm border border-blue-100/30",
      text: "text-blue-700",
      icon: FaCheck,
      label: "Concluído",
    },
    cancelled: {
      bg: "bg-white/40 backdrop-blur-sm border border-red-100/30",
      text: "text-red-700",
      icon: null,
      label: "Cancelado",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  if (compact) {
    return (
      <span className={`${config.bg} ${config.text} px-2 py-1 rounded-full text-xs font-semibold`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className={`${config.bg} ${config.text} px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5`}>
      {Icon && <Icon className="h-4 w-4" />}
      {config.label}
    </div>
  )
}
