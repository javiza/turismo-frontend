import "server-only";
import { cookies } from "next/headers";
import {
  COOKIE_ADMIN_ACCESS,
  COOKIE_ADMIN_REFRESH,
  COOKIE_CLIENTE_ACCESS,
  COOKIE_CLIENTE_REFRESH,
} from "@/lib/cookie-names";

// Re-exportadas para no romper los imports existentes desde session.ts
export {
  COOKIE_ADMIN_ACCESS,
  COOKIE_ADMIN_REFRESH,
  COOKIE_CLIENTE_ACCESS,
  COOKIE_CLIENTE_REFRESH,
};

const ACCESS_MAX_AGE = 30 * 60; // 30 min, igual a JWT_ACCESS_EXPIRES. El refresh
// automático (ver lib/refresh.ts) ya cubre la renovación; este valor solo
// necesita ser conservador, no mínimo — subirlo de 15 a 30 min reduce a la
// mitad la frecuencia de refresh sin debilitar la ventana de exposición del
// access token de forma relevante.
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // 7 días

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setAdminSession(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(COOKIE_ADMIN_ACCESS, accessToken, { ...baseCookie, maxAge: ACCESS_MAX_AGE });
  store.set(COOKIE_ADMIN_REFRESH, refreshToken, { ...baseCookie, maxAge: REFRESH_MAX_AGE });
}

export async function setClienteSession(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(COOKIE_CLIENTE_ACCESS, accessToken, { ...baseCookie, maxAge: ACCESS_MAX_AGE });
  store.set(COOKIE_CLIENTE_REFRESH, refreshToken, { ...baseCookie, maxAge: REFRESH_MAX_AGE });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_ADMIN_ACCESS);
  store.delete(COOKIE_ADMIN_REFRESH);
}

export async function clearClienteSession() {
  const store = await cookies();
  store.delete(COOKIE_CLIENTE_ACCESS);
  store.delete(COOKIE_CLIENTE_REFRESH);
}

export async function getSessionTokens() {
  const store = await cookies();
  return {
    adminAccess: store.get(COOKIE_ADMIN_ACCESS)?.value,
    adminRefresh: store.get(COOKIE_ADMIN_REFRESH)?.value,
    clienteAccess: store.get(COOKIE_CLIENTE_ACCESS)?.value,
    clienteRefresh: store.get(COOKIE_CLIENTE_REFRESH)?.value,
  };
}
