import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // `tarjeta-app` + bg-tarjeta-app: el color de fondo lo elige el admin
        // (Contenido → Colores del sitio); ver --color-tarjeta-app en
        // globals.css y lib/tema-sitio.ts.
        "tarjeta-app bg-tarjeta-app rounded-card border border-sun-100 shadow-sm shadow-sun-900/5",
        className,
      )}
      {...props}
    />
  );
}
