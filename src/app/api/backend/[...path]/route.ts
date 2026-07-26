import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/backend";
import { getSessionTokens } from "@/lib/session";
import { refreshAdminToken, refreshClienteToken } from "@/lib/refresh";

// Métodos soportados por el proxy. GET/POST/PATCH/DELETE cubren toda la API.
const METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE"] as const;

async function forward(req: NextRequest, path: string[]) {
  const targetPath = "/" + path.join("/");
  const search = req.nextUrl.search;
  const { adminAccess, adminRefresh, clienteAccess, clienteRefresh } = await getSessionTokens();

  // El proxy no sabe "a priori" si la ruta es de admin o de cliente,
  // así que prioriza el token que exista. Si hay ambos (raro, pero posible
  // en el mismo navegador), prioriza admin porque las rutas de gestión
  // son casi todas /destinos, /paquetes, etc. compartidas con el público.
  let token = adminAccess ?? clienteAccess;
  const isAdminToken = Boolean(adminAccess);

  const method = req.method;
  const hasBody = method !== "GET" && method !== "DELETE";

  // Las subidas de imágenes (POST /uploads/...) llegan como
  // multipart/form-data. Antes este proxy siempre leía el body con
  // req.text() y forzaba Content-Type: application/json al reenviarlo,
  // lo que corrompía el binario y perdía el boundary del multipart —
  // por eso subir una foto desde el computador fallaba silenciosamente.
  // Para cualquier body que no sea JSON, reenviamos el binario tal cual
  // (arrayBuffer) y conservamos el Content-Type original (con su boundary).
  const contentType = req.headers.get("content-type") ?? "application/json";
  const isJson = contentType.includes("application/json");
  const body = hasBody ? (isJson ? await req.text() : await req.arrayBuffer()) : undefined;

  async function doFetch(bearer?: string) {
    return fetch(`${API_URL}${targetPath}${search}`, {
      method,
      headers: {
        "Content-Type": contentType,
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body,
      cache: "no-store",
      // @ts-expect-error -- requerido por undici para enviar bodies binarios de tamaño conocido
      duplex: "half",
    });
  }

  let res = await doFetch(token);

  // Si expiró el access token, intentamos refrescar una vez y reintentar.
  if (res.status === 401 && token) {
    const newToken = isAdminToken
      ? adminRefresh
        ? await refreshAdminToken(adminRefresh)
        : null
      : clienteRefresh
        ? await refreshClienteToken(clienteRefresh)
        : null;

    if (newToken) {
      token = newToken;
      res = await doFetch(token);
    }
  }

  const text = await res.text();
  const responseBody = text || null;

  return new NextResponse(responseBody, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
