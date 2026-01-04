"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  size?: "sm" | "md" | "lg" | "xl"
  fallback?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = "", size = "md", fallback, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false)

    const sizes = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-16 w-16",
      xl: "h-24 w-24",
    }

    const iconSizes = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    }

    const textSizes = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-xl",
      xl: "text-3xl",
    }

    const showFallback = !src || hasError

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-pink-400 backdrop-blur-sm border border-white/40 shadow-md",
          sizes[size],
          className
        )}
        {...props}
      >
        {!showFallback ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            onError={() => setHasError(true)}
          />
        ) : fallback ? (
          <span className={cn("font-medium text-white", textSizes[size])}>
            {fallback.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <User className={cn("text-white", iconSizes[size])} />
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
