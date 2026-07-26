import "server-only";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export interface BackendResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Llama directo al backend NestJS. Solo usar desde Route Handlers / Server
 * Components.
 *
 * `revalidate` (segundos): antes esta función siempre usaba
 * `cache: "no-store"`, así que CADA visita a una página pública (home,
 * destinos, paquetes, ofertas) volvía a pegarle al backend, aunque ese
 * contenido casi no cambia (lo edita un admin de vez en cuando). Pasar
 * `revalidate` activa el cache de datos de Next (ISR): la misma respuesta
 * se reutiliza hasta que pase ese tiempo, sin dejar de reflejar cambios
 * del admin en, como mucho, esa ventana. No pasar `revalidate` (default)
 * mantiene el comportamiento anterior — lo correcto para todo lo
 * autenticado o específico del usuario (dashboard, reservas, etc.), que
 * nunca debe servirse cacheado.
 */
export async function callBackend<T = unknown>(
  path: string,
  init?: RequestInit & { revalidate?: number },
): Promise<BackendResult<T>> {
  const { revalidate, ...rest } = init ?? {};

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...rest.headers,
    },
    ...(revalidate !== undefined
      ? { next: { revalidate } }
      : { cache: "no-store" as const }),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  return { ok: res.ok, status: res.status, data: data as T };
}

export { API_URL };
