"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

// Evita registrar la misma visita más de una vez por carga de página
// (ej. si el componente se remonta por algún motivo, o por el doble
// efecto de React en modo desarrollo).
const yaRegistradas = new Set<string>();

/**
 * Registra una visita a un destino o paquete la primera vez que el card
 * correspondiente se muestra en pantalla. Es "fire and forget": si falla
 * (backend caído, red, etc.) no interrumpe la navegación del visitante.
 */
export function useRegistrarVisita(params: { destinoId?: number; paqueteId?: number }) {
  const { destinoId, paqueteId } = params;

  useEffect(() => {
    if (!destinoId && !paqueteId) return;

    const clave = `${destinoId ?? ""}:${paqueteId ?? ""}`;
    if (yaRegistradas.has(clave)) return;
    yaRegistradas.add(clave);

    apiFetch("/visitas", {
      method: "POST",
      body: JSON.stringify({ destinoId, paqueteId }),
    }).catch(() => {
      // Silencioso a propósito: el tracking de visitas nunca debe
      // interrumpir ni mostrar errores al visitante.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinoId, paqueteId]);
}
