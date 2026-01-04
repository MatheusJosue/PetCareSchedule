"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    id,
    ...props
  }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium"
            style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none [&_svg]:h-[18px] [&_svg]:w-[18px]"
              style={{ color: 'var(--text-muted)' }}
            >
              {leftIcon}
            </span>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              "w-full h-11 rounded-xl",
              "border text-sm",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20 focus:border-[#a855f7]",
              "hover:border-[var(--border-hover)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "placeholder:text-[var(--text-hint)]",
              error && "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]/20",
              className
            )}
            style={{
              paddingLeft: leftIcon ? '42px' : '14px',
              paddingRight: rightIcon ? '42px' : '14px',
              background: 'var(--input-bg)',
              borderColor: error ? 'var(--accent-red)' : 'var(--input-border)',
              color: 'var(--text-primary)',
            }}
            ref={ref}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {rightIcon && (
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 [&_svg]:h-[18px] [&_svg]:w-[18px]"
              style={{ color: 'var(--text-muted)' }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs flex items-center"
            style={{ marginTop: '6px', gap: '6px', color: 'var(--accent-red)' }}
          >
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-xs"
            style={{ marginTop: '6px', color: 'var(--text-muted)' }}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
