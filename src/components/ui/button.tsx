import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:
    "bg-clay-500 text-white hover:bg-clay-600 shadow-sm shadow-clay-500/20 focus-visible:outline-clay-600",
  secondary:
    "bg-sun-300 text-ink-900 hover:bg-sun-400 focus-visible:outline-sun-600",
  accent:
    "bg-ocean-500 text-white hover:bg-ocean-600 shadow-sm shadow-ocean-500/20 focus-visible:outline-ocean-600",
  ghost: "bg-transparent text-ink-800 hover:bg-sun-100",
  danger: "bg-danger text-white hover:brightness-95",
};

const sizes = {
  sm: "text-sm px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-xl",
  lg: "text-base px-6 py-3 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
