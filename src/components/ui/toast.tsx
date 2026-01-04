"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, message, type }])

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  removeToast: (id: string) => void
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed z-50"
      style={{
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const Icon = icons[toast.type]

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'var(--accent-green-bg)',
          border: 'var(--accent-green)',
          text: 'var(--accent-green)',
          icon: 'var(--accent-green)'
        }
      case 'error':
        return {
          bg: 'var(--accent-red-bg)',
          border: 'var(--accent-red)',
          text: 'var(--accent-red)',
          icon: 'var(--accent-red)'
        }
      case 'warning':
        return {
          bg: 'var(--accent-yellow-bg)',
          border: 'var(--accent-yellow)',
          text: 'var(--accent-yellow)',
          icon: 'var(--accent-yellow)'
        }
      case 'info':
        return {
          bg: 'var(--accent-blue-bg)',
          border: 'var(--accent-blue)',
          text: 'var(--accent-blue)',
          icon: 'var(--accent-blue)'
        }
    }
  }

  const colors = getColors(toast.type)

  return (
    <div
      className={cn(
        "flex items-center rounded-2xl border-l-4 backdrop-blur-xl",
        "animate-in slide-in-from-right-full duration-300"
      )}
      style={{
        padding: '16px 20px',
        gap: '12px',
        minWidth: '320px',
        maxWidth: '420px',
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
        borderLeftColor: colors.border,
        boxShadow: 'var(--shadow-lg)'
      }}
      role="alert"
    >
      <div
        className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center"
        style={{ background: colors.bg }}
      >
        <Icon className="h-5 w-5" style={{ color: colors.icon }} />
      </div>
      <p
        className="flex-1 text-sm font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
        style={{
          color: 'var(--text-muted)',
          background: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-tertiary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
