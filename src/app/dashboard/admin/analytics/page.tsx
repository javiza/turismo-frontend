"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Ruta antigua de "Big data" (ahora "Análisis"). El contenido se movió
 * dentro de Finanzas > Administración (ver components/admin/analisis-panel
 * y components/admin/administracion-panel), así que esto solo redirige
 * a quien tenga el enlace viejo guardado.
 */
export default function AdminAnalyticsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/admin/finanzas");
  }, [router]);

  return null;
}
