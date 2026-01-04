"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "success";
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Icon size classes that use !important to override any icon-specific classes
    // Using [&_svg] to target all descendant SVGs (Lucide icons are components that render SVGs)
    const iconSizeClasses = {
      sm: "[&_svg]:!w-3.5 [&_svg]:!h-3.5 [&_svg]:!min-w-3.5 [&_svg]:!min-h-3.5",
      default: "[&_svg]:!w-4 [&_svg]:!h-4 [&_svg]:!min-w-4 [&_svg]:!min-h-4",
      lg: "[&_svg]:!w-4 [&_svg]:!h-4 [&_svg]:!min-w-4 [&_svg]:!min-h-4",
      xl: "[&_svg]:!w-[18px] [&_svg]:!h-[18px] [&_svg]:!min-w-[18px] [&_svg]:!min-h-[18px]",
      icon: "[&_svg]:!w-4 [&_svg]:!h-4 [&_svg]:!min-w-4 [&_svg]:!min-h-4",
    };

    const baseStyles = cn(
      "relative inline-flex items-center justify-center",
      "whitespace-nowrap rounded-xl font-semibold",
      "transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "active:scale-[0.98]",
      "overflow-hidden",
      "[&_svg]:shrink-0 [&_svg]:flex-shrink-0",
      iconSizeClasses[size]
    );

    const variants = {
      default: cn(
        "bg-gradient-to-r from-[#7c3aed] to-[#a855f7]",
        "text-white",
        "shadow-lg shadow-purple-400/30",
        "hover:shadow-purple-400/50",
        "hover:scale-[1.02]",
        "focus-visible:ring-[#7c3aed]"
      ),
      secondary: cn(
        "border-2",
        "hover:scale-[1.01]",
        "focus-visible:ring-[#94a3b8]"
      ),
      outline: cn(
        "border-2 border-[#7c3aed]/50 bg-transparent",
        "text-[#7c3aed]",
        "hover:bg-[#7c3aed]/10",
        "hover:border-[#7c3aed]",
        "focus-visible:ring-[#7c3aed]"
      ),
      ghost: cn(
        "bg-transparent",
        "hover:scale-[1.01]",
        "focus-visible:ring-[#94a3b8]"
      ),
      destructive: cn(
        "bg-gradient-to-r from-[#ef4444] to-[#f87171]",
        "text-white",
        "shadow-lg shadow-red-400/30",
        "hover:shadow-red-400/50",
        "hover:scale-[1.02]",
        "focus-visible:ring-[#ef4444]"
      ),
      success: cn(
        "bg-gradient-to-r from-[#10b981] to-[#34d399]",
        "text-white",
        "shadow-lg shadow-emerald-400/30",
        "hover:shadow-emerald-400/50",
        "hover:scale-[1.02]",
        "focus-visible:ring-[#10b981]"
      ),
    };

    const sizeClasses = {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-sm",
      xl: "text-base",
      icon: "",
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { height: 32, paddingLeft: 16, paddingRight: 16, gap: 8 },
      default: { height: 40, paddingLeft: 20, paddingRight: 20, gap: 10 },
      lg: { height: 44, paddingLeft: 24, paddingRight: 24, gap: 12 },
      xl: { height: 48, paddingLeft: 32, paddingRight: 32, gap: 12 },
      icon: { height: 32, width: 32, padding: 0 },
    };

    // Inline styles for theme-aware variants
    const getVariantStyles = (): React.CSSProperties => {
      switch (variant) {
        case "secondary":
          return {
            background: "var(--bg-tertiary)",
            borderColor: "var(--border-primary)",
            color: "var(--text-secondary)",
          };
        case "ghost":
          return {
            color: "var(--text-muted)",
          };
        default:
          return {};
      }
    };

    const buttonStyle: React.CSSProperties = {
      ...sizeStyles[size],
      ...getVariantStyles(),
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        style={buttonStyle}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
