import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

const INTERVALO_MS = 20_000;

/** Mismo patrón que useConsultasNoLeidas: badge del menú admin con proveedores nuevos sin revisar. */
export function useProveedoresNoLeidos() {
  const query = useQuery({
    queryKey: ["proveedores-no-leidos-count"],
    queryFn: () => apiFetch<{ count: number }>("/proveedores/no-leidos/count"),
    refetchInterval: INTERVALO_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  return query.data?.count ?? 0;
}
