import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";
import { getSessionTokens } from "@/lib/session";
import { refreshAdminToken, refreshClienteToken } from "@/lib/refresh";
import type { AdminUser, Cliente } from "@/types";

export async function GET() {
  const { adminAccess, adminRefresh, clienteAccess, clienteRefresh } = await getSessionTokens();

  if (adminAccess) {
    let token = adminAccess;
    let profile = await callBackend<AdminUser>("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (profile.status === 401 && adminRefresh) {
      const newToken = await refreshAdminToken(adminRefresh);
      if (newToken) {
        token = newToken;
        profile = await callBackend<AdminUser>("/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }

    if (profile.ok) {
      return NextResponse.json({ role: "admin", profile: profile.data });
    }
  }

  if (clienteAccess) {
    let token = clienteAccess;
    let profile = await callBackend<Cliente>("/clientes-auth/perfil", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (profile.status === 401 && clienteRefresh) {
      const newToken = await refreshClienteToken(clienteRefresh);
      if (newToken) {
        token = newToken;
        profile = await callBackend<Cliente>("/clientes-auth/perfil", {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }

    if (profile.ok) {
      return NextResponse.json({ role: "cliente", profile: profile.data });
    }
  }

  return NextResponse.json({ role: null, profile: null });
}
