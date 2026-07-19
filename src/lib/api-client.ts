export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function extractMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const msg = (payload as { message: string | string[] }).message;
    return Array.isArray(msg) ? msg.join(", ") : msg;
  }
  return fallback;
}

/**
 * Fetch autenticado hacia el backend, siempre a través de /api/backend/*
 * (el proxy de Next.js) para que el JWT viva en cookie httpOnly y nunca
 * toque el JS del navegador.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(data, "Ocurrió un error inesperado"), data);
  }

  return data as T;
}
