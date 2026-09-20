"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Hace que un cambio del panel admin se vea AL INSTANTE en la página que
 * el admin tiene abierta (navbar, footer, colores, tipografía, favicon...).
 *
 * Son dos pasos y el orden importa:
 *  1. Invalida el caché de contenido-home (POST /api/revalidate/contenido-home).
 *     Se espera a que termine: si se refrescara antes, Next volvería a
 *     leer el dato viejo del caché.
 *  2. router.refresh(): vuelve a renderizar en el servidor el layout y la
 *     página actual con los datos nuevos, sin recargar el navegador ni
 *     perder lo que el admin tenga escrito en otros formularios.
 *
 * Si la invalidación falla (ej. red lenta) igual se refresca: en el peor
 * caso el cambio tarda hasta 60s en reflejarse, como antes.
 */
export function useRefrescarSitio() {
  const router = useRouter();

  return useCallback(async () => {
    try {
      await fetch("/api/revalidate/contenido-home", { method: "POST" });
    } catch {
      // Sin bloquear el flujo de guardado.
    }
    router.refresh();
  }, [router]);
}
