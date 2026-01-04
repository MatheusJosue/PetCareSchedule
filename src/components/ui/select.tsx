"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || React.useId()

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium"
            style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              "w-full h-11 appearance-none rounded-xl",
              "border text-sm",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20 focus:border-[#a855f7]",
              "hover:border-[var(--border-hover)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]/20",
              className
            )}
            style={{
              paddingLeft: '14px',
              paddingRight: '40px',
              background: 'var(--input-bg)',
              borderColor: error ? 'var(--accent-red)' : 'var(--input-border)',
              color: 'var(--text-primary)'
            }}
            ref={ref}
            aria-invalid={error ? "true" : "false"}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
        {error && (
          <p
            className="text-xs flex items-center"
            style={{ marginTop: '6px', gap: '6px', color: 'var(--accent-red)' }}
          >
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
