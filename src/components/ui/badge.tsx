"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "pending" | "primary"
  size?: "sm" | "md" | "lg"
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const variants = {
      default: cn(
        "bg-[var(--glass-bg)] backdrop-blur-md",
        "text-[var(--text-secondary)] border border-[var(--glass-border)]"
      ),
      primary: cn(
        "bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md",
        "text-purple-300 border border-purple-500/30"
      ),
      success: cn(
        "bg-emerald-500/15 backdrop-blur-md",
        "text-emerald-400 border border-emerald-500/30"
      ),
      warning: cn(
        "bg-amber-500/15 backdrop-blur-md",
        "text-amber-400 border border-amber-500/30"
      ),
      error: cn(
        "bg-red-500/15 backdrop-blur-md",
        "text-red-400 border border-red-500/30"
      ),
      info: cn(
        "bg-blue-500/15 backdrop-blur-md",
        "text-blue-400 border border-blue-500/30"
      ),
      pending: cn(
        "bg-yellow-500/15 backdrop-blur-md",
        "text-yellow-400 border border-yellow-500/30"
      ),
    }

    const sizes = {
      sm: "px-2 py-0.5 text-[10px]",
      md: "px-2.5 py-1 text-xs",
      lg: "px-3 py-1.5 text-sm",
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5",
          "rounded-full font-semibold",
          "transition-all duration-200",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

// Status Badge component for appointment statuses
interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "pending" | "confirmed" | "completed" | "cancelled"
  showIcon?: boolean
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showIcon = true, className, ...props }, ref) => {
    const statusConfig = {
      pending: {
        label: "Pendente",
        variant: "warning" as const,
        icon: (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      confirmed: {
        label: "Confirmado",
        variant: "success" as const,
        icon: (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      },
      completed: {
        label: "Concluido",
        variant: "info" as const,
        icon: (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      cancelled: {
        label: "Cancelado",
        variant: "error" as const,
        icon: (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      },
    }

    const config = statusConfig[status]

    return (
      <Badge ref={ref} variant={config.variant} className={className} {...props}>
        {showIcon && config.icon}
        {config.label}
      </Badge>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { Badge, StatusBadge }
