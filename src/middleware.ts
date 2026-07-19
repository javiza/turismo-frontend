import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_ADMIN_ACCESS,
  COOKIE_ADMIN_REFRESH,
  COOKIE_CLIENTE_ACCESS,
  COOKIE_CLIENTE_REFRESH,
} from "@/lib/cookie-names";

// Nota: el middleware solo verifica que exista *alguna* cookie de sesión
// (no valida el JWT en sí, eso ya lo hace NestJS en cada request real).
// Es una redirección rápida en el borde; la autorización de verdad
// siempre la hace el backend.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard/admin")) {
    const hasAdmin =
      req.cookies.has(COOKIE_ADMIN_ACCESS) || req.cookies.has(COOKIE_ADMIN_REFRESH);
    if (!hasAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/login/admin";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/dashboard/cliente")) {
    const hasCliente =
      req.cookies.has(COOKIE_CLIENTE_ACCESS) || req.cookies.has(COOKIE_CLIENTE_REFRESH);
    if (!hasCliente) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
