import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white rounded-card border border-sun-100 shadow-sm shadow-sun-900/5",
        className,
      )}
      {...props}
    />
  );
}
