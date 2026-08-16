import { NextRequest, NextResponse } from "next/server";
import { callBackend } from "@/lib/backend";
import { getSessionTokens } from "@/lib/session";
import type { AdminUser, AuthTokens } from "@/types";

/**
 * Reconfirma la contraseña del admin ya autenticado, para desbloquear la
 * sección "Administración" dentro de Finanzas. No abre una sesión nueva
 * ni toca las cookies: solo reintenta el login del backend con el email
 * del admin actual (sacado de su propio token) y la contraseña recibida,
 * y devuelve si coincidió o no. Así reutilizamos la validación de
 * contraseña que ya existe en el backend sin duplicar lógica ni guardar
 * un "PIN" aparte en ningún lado.
 */
export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!password || typeof password !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { adminAccess } = await getSessionTokens();
  if (!adminAccess) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const perfil = await callBackend<AdminUser>("/auth/profile", {
    headers: { Authorization: `Bearer ${adminAccess}` },
  });

  if (!perfil.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const intento = await callBackend<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: perfil.data.email, password }),
  });

  return NextResponse.json({ ok: intento.ok });
}
