"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "./button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  showCloseButton = true,
  size = "md",
}: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: "max-w-[400px]",
    md: "max-w-[500px]",
    lg: "max-w-[600px]",
    xl: "max-w-[700px]",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: '24px' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
        className={cn(
          "relative z-10 w-full",
          sizes[size],
          "rounded-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
        style={{
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              "flex items-start justify-between",
              title && "border-b"
            )}
            style={{
              padding: '20px 24px',
              paddingBottom: title ? '16px' : '20px',
              gap: '16px',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id="modal-title"
                  className="text-[1.125rem] font-semibold truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="text-[14px] line-clamp-2"
                  style={{ marginTop: '4px', color: 'var(--text-muted)' }}
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  "flex-shrink-0 h-8 w-8 rounded-lg",
                  "flex items-center justify-center",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-[#a855f7]/30"
                )}
                style={{
                  color: 'var(--text-muted)',
                  background: 'var(--bg-tertiary)'
                }}
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '20px 24px', paddingTop: title ? '16px' : '20px' }}>{children}</div>
      </div>
    </div>
  )
}

interface ModalActionsProps {
  children: React.ReactNode
  className?: string
}

export function ModalActions({ children, className }: ModalActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end border-t",
        className
      )}
      style={{
        gap: '12px',
        paddingTop: '20px',
        marginTop: '16px',
        borderColor: 'var(--border-primary)'
      }}
    >
      {children}
    </div>
  )
}

// Confirmation Modal for delete/dangerous actions
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const variantConfig = {
    danger: {
      icon: (
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center"
          style={{ marginBottom: '16px', background: 'var(--accent-red-bg)' }}
        >
          <svg className="h-6 w-6" style={{ color: 'var(--accent-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      ),
      buttonVariant: "destructive" as const,
    },
    warning: {
      icon: (
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center"
          style={{ marginBottom: '16px', background: 'var(--accent-yellow-bg)' }}
        >
          <svg className="h-6 w-6" style={{ color: 'var(--accent-yellow)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      ),
      buttonVariant: "default" as const,
    },
    info: {
      icon: (
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center"
          style={{ marginBottom: '16px', background: 'var(--accent-blue-bg)' }}
        >
          <svg className="h-6 w-6" style={{ color: 'var(--accent-blue)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      buttonVariant: "default" as const,
    },
  }

  const config = variantConfig[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} size="sm">
      <div className="text-center">
        <div className="flex justify-center">{config.icon}</div>
        <h3
          className="text-[1rem] font-semibold"
          style={{ marginBottom: '8px', color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
        <p
          className="text-[14px]"
          style={{ marginBottom: '24px', color: 'var(--text-muted)' }}
        >
          {description}
        </p>
        <div className="flex justify-center" style={{ gap: '12px' }}>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
