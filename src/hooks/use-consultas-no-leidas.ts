import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

const INTERVALO_MS = 20_000;

/**
 * Ticket de notificación visible: consulta cada 20s cuántas consultas de
 * clientes están sin leer. Se usa tanto para el badge del menú admin como
 * para el aviso (toast) dentro de la propia sección "Consultas clientes"
 * cuando llega una consulta nueva mientras la página está abierta.
 *
 * No sustituye al correo (que ya se envía desde el backend al crear la
 * cotización) — es el aviso *dentro de la app*, para que un admin que ya
 * está trabajando en el panel note la consulta nueva sin depender de
 * revisar su bandeja de entrada.
 */
export function useConsultasNoLeidas(opts?: { avisar?: boolean }) {
  const avisar = opts?.avisar ?? false;
  const anterior = useRef<number | null>(null);

  const query = useQuery({
    queryKey: ["cotizaciones-no-leidas-count"],
    queryFn: () => apiFetch<{ count: number }>("/cotizaciones/no-leidas/count"),
    refetchInterval: INTERVALO_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (!avisar || query.data === undefined) return;

    const actual = query.data.count;
    if (anterior.current !== null && actual > anterior.current) {
      const nuevas = actual - anterior.current;
      toast.info(
        nuevas === 1
          ? "Llegó una nueva consulta de un cliente"
          : `Llegaron ${nuevas} nuevas consultas de clientes`,
      );
    }
    anterior.current = actual;
  }, [avisar, query.data]);

  return query.data?.count ?? 0;
}
