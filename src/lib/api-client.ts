export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Nombre del evento que se dispara en `window` cuando el backend responde
 * 401 a través del proxy /api/backend/* (ver [...path]/route.ts, que ya
 * intenta refrescar el token una vez antes de devolver 401). Si llega
 * hasta acá, la sesión realmente terminó (refresh token también vencido,
 * o no hay sesión). Quien escuche este evento (ver
 * hooks/use-session-expiry.ts) es responsable de limpiar la sesión y
 * redirigir a login, para no dejar a las queries de polling (badges de
 * "no leídas", analytics, etc.) reintentando 401 para siempre.
 */
export const EVENTO_SESION_EXPIRADA = "auth:session-expired";

function notificarSesionExpirada() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
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
    if (res.status === 401) {
      notificarSesionExpirada();
    }
    throw new ApiError(res.status, extractMessage(data, "Ocurrió un error inesperado"), data);
  }

  return data as T;
}

/**
 * Sube un archivo de imagen desde el computador del admin hacia
 * POST /uploads/imagenes/:carpeta (Cloudinary vía el backend) y devuelve
 * la URL final. A diferencia de apiFetch, NO fija Content-Type: el
 * navegador debe generarlo solo (incluye el boundary del multipart).
 */
export async function subirImagen(
  archivo: File,
  carpeta: "destinos" | "paquetes" | "ofertas" | "contenido",
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const res = await fetch(`/api/backend/uploads/imagenes/${carpeta}`, {
    method: "POST",
    body: formData,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(data, "No se pudo subir la imagen"), data);
  }

  return data as { url: string };
}

/**
 * Sube un archivo de tipografía (.ttf/.otf/.woff/.woff2) para el slogan
 * de la home. Va aparte de subirImagen porque el backend valida
 * extensión/tamaño distintos y lo sube como recurso "raw" a Cloudinary.
 */
export async function subirFuente(archivo: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const res = await fetch(`/api/backend/uploads/fuentes`, {
    method: "POST",
    body: formData,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(data, "No se pudo subir la tipografía"), data);
  }

  return data as { url: string };
}
