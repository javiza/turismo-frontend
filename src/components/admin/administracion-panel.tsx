"use client";

import { useState } from "react";
import { ShieldCheck, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AnalisisPanel } from "@/components/admin/analisis-panel";

/**
 * Sub-sección "Administración" dentro de Finanzas: agrupa contenido más
 * sensible (por ahora, Análisis). Ya no tiene su propio candado porque
 * toda la página de Finanzas está protegida con contraseña (ver
 * PasswordGate en finanzas/page.tsx) — pedirla dos veces sería
 * redundante.
 */
export function AdministracionPanel() {
  const [abierto, setAbierto] = useState(false);

  return (
    <Card className="p-6">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-3 w-full text-left"
      >
        <div className="size-9 rounded-lg bg-sun-100 text-clay-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="size-4" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-ink-900">Administración</h3>
          <p className="text-xs text-ink-400">Análisis de visitas, reservas y ventas.</p>
        </div>
        <ChevronDown
          className={`size-4 text-ink-400 transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <div className="mt-6">
          <AnalisisPanel />
        </div>
      )}
    </Card>
  );
}
