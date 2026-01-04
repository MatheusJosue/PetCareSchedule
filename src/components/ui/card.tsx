"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outline"
  padding?: "none" | "sm" | "md" | "lg" | "xl"
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "lg", hover = false, ...props }, ref) => {
    const variants = {
      default: cn(
        "bg-white",
        "border border-[#e2e8f0]",
        "shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
      ),
      elevated: cn(
        "bg-white",
        "shadow-[0_4px_40px_rgba(0,0,0,0.08)]"
      ),
      outline: cn(
        "bg-white",
        "border-2 border-[#e2e8f0]"
      ),
    }

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
      xl: "p-8",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl",
          "transition-all duration-200",
          variants[variant],
          paddings[padding],
          hover && "hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5",
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col", className)}
    style={{ gap: '6px', paddingBottom: '20px' }}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-[1.25rem] font-semibold tracking-tight text-[#1e293b] leading-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[14px] text-[#64748b] leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center mt-auto", className)}
    style={{ paddingTop: '20px' }}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
