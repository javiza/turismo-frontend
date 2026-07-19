import "server-only";
import { callBackend } from "@/lib/backend";
import {
  setAdminSession,
  setClienteSession,
  clearAdminSession,
  clearClienteSession,
} from "@/lib/session";
import type { AuthTokens } from "@/types";

export async function refreshAdminToken(refreshToken: string): Promise<string | null> {
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
}

export async function refreshClienteToken(refreshToken: string): Promise<string | null> {
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
}
