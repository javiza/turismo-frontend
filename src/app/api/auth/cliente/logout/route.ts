import { NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";
import { clearClienteSession, getSessionTokens } from "@/lib/session";

export async function POST() {
  const { clienteAccess } = await getSessionTokens();

  if (clienteAccess) {
    await callBackend("/clientes-auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${clienteAccess}` },
    });
  }

  await clearClienteSession();

  return NextResponse.json({ ok: true });
}
