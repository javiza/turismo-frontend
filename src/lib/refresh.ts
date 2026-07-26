import "server-only";
import { callBackend } from "@/lib/backend";
import {
  setAdminSession,
  setClienteSession,
  clearAdminSession,
  clearClienteSession,
} from "@/lib/session";
import type { AuthTokens } from "@/types";

/**
 * "Single-flight" de refresh: si dos requests llegan casi al mismo tiempo
 * con el access token vencido (típico al abrir Finanzas, que dispara 6
 * llamadas en paralelo), ambas leen el MISMO refresh token de la cookie
 * y, sin esto, cada una intentaba refrescar por su cuenta. El backend
 * rota el refresh token en cada uso (ver AuthService.refresh): la primera
 * llamada lo lograba, pero la segunda llegaba con el token ya viejo,
 * fallaba, y borraba la cookie de sesión recién buena — la sesión se
 * caía en medio de un uso normal del panel, sin que el usuario hiciera
 * nada raro.
 *
 * La solución: mientras haya un refresh en curso para un mismo refresh
 * token, las llamadas siguientes esperan esa misma promesa en vez de
 * disparar una request nueva contra el backend.
 */
const enVuelo = new Map<string, Promise<string | null>>();

function conSingleFlight(
  refreshToken: string,
  ejecutar: () => Promise<string | null>,
): Promise<string | null> {
  const existente = enVuelo.get(refreshToken);
  if (existente) {
    return existente;
  }

  const promesa = ejecutar().finally(() => {
    enVuelo.delete(refreshToken);
  });

  enVuelo.set(refreshToken, promesa);
  return promesa;
}

export function refreshAdminToken(refreshToken: string): Promise<string | null> {
  return conSingleFlight(refreshToken, async () => {
    const result = await callBackend<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!result.ok) {
      await clearAdminSession();
      return null;
    }

    await setAdminSession(result.data.access_token, result.data.refresh_token);
    return result.data.access_token;
  });
}

export function refreshClienteToken(refreshToken: string): Promise<string | null> {
  return conSingleFlight(refreshToken, async () => {
    const result = await callBackend<AuthTokens>("/clientes-auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!result.ok) {
      await clearClienteSession();
      return null;
    }

    await setClienteSession(result.data.access_token, result.data.refresh_token);
    return result.data.access_token;
  });
}
