"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EVENTO_SESION_EXPIRADA } from "@/lib/api-client";
import { useSessionStore } from "@/store/session-store";

/**
 * Antes, si el token de sesión expiraba mientras el admin/cliente tenía
 * el panel abierto, no pasaba nada visible: las queries de polling
 * (badges de "no leídas", analytics del dashboard, etc.) seguían
 * reintentando cada 20s contra endpoints que ya devolvían 401 en cascada,
 * sin avisar ni redirigir a login. Este hook escucha el evento que
 * dispara apiFetch en el primer 401 real (ver lib/api-client.ts) y corta
 * eso de raíz: limpia la sesión en el store y manda a login, lo que de
 * paso hace que esas queries dejen de montarse.
 */
export function useSessionExpiry() {
  const router = useRouter();
  const clear = useSessionStore((s) => s.clear);
  const role = useSessionStore((s) => s.role);
  const yaAvisado = useRef(false);

  useEffect(() => {
    function handleSessionExpired() {
      if (yaAvisado.current) return;
      yaAvisado.current = true;

      const eraAdmin = role === "admin";
      clear();
      toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
      router.push(eraAdmin ? "/login/admin" : "/login");
    }

    window.addEventListener(EVENTO_SESION_EXPIRADA, handleSessionExpired);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, handleSessionExpired);
  }, [role, clear, router]);
}
