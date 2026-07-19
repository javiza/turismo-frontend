import "server-only";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export interface BackendResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

/** Llama directo al backend NestJS. Solo usar desde Route Handlers / Server Components. */
export async function callBackend<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<BackendResult<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  return { ok: res.ok, status: res.status, data: data as T };
}

export { API_URL };
