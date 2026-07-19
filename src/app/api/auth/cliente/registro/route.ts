import { NextRequest, NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";
import { setClienteSession } from "@/lib/session";
import type { AuthTokens } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const registro = await callBackend("/clientes-auth/registro", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!registro.ok) {
    return NextResponse.json(registro.data, { status: registro.status });
  }

  // El backend no devuelve tokens en el registro, así que encadenamos un
  // login para dejar al cliente con sesión iniciada de una vez.
  const login = await callBackend<AuthTokens>("/clientes-auth/login", {
    method: "POST",
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  if (!login.ok) {
    return NextResponse.json({ ok: true, autoLogin: false });
  }

  await setClienteSession(login.data.access_token, login.data.refresh_token);

  return NextResponse.json({ ok: true, autoLogin: true });
}
