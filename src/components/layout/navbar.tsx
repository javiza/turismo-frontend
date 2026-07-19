"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Compass, User, LayoutDashboard, LogOut } from "lucide-react";
import { useSessionStore } from "@/store/session-store";
import { Button } from "@/components/ui/button";

export function Navbar({ nombreAgencia = "Tu Agencia de Viajes" }: { nombreAgencia?: string }) {
  const [open, setOpen] = useState(false);
  const { role, adminProfile, clienteProfile } = useSessionStore();

  async function handleLogout() {
    const endpoint = role === "admin" ? "/api/auth/admin/logout" : "/api/auth/cliente/logout";
    await fetch(endpoint, { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-sun-100">
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-clay-600">
          <Compass className="size-6" strokeWidth={1.75} />
          {nombreAgencia}
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-800">
          <Link href="/destinos" className="hover:text-clay-600">
            Destinos
          </Link>
          <Link href="/paquetes" className="hover:text-clay-600">
            Paquetes
          </Link>
          <Link href="/ofertas" className="hover:text-clay-600">
            Ofertas
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {role === "admin" && (
            <Link href="/dashboard/admin">
              <Button variant="secondary" size="sm">
                <LayoutDashboard className="size-4" /> Panel admin
              </Button>
            </Link>
          )}
          {role === "cliente" && (
            <Link href="/dashboard/cliente">
              <Button variant="secondary" size="sm">
                <User className="size-4" /> {clienteProfile?.nombre?.split(" ")[0] ?? "Mi cuenta"}
              </Button>
            </Link>
          )}
          {role ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              Salir
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Ingresar
                </Button>
              </Link>
              <Link href="/registro">
                <Button variant="primary" size="sm">
                  Crear cuenta
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 text-ink-800"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-sun-100 px-4 py-4 flex flex-col gap-3 bg-cream">
          <Link href="/destinos" onClick={() => setOpen(false)}>
            Destinos
          </Link>
          <Link href="/paquetes" onClick={() => setOpen(false)}>
            Paquetes
          </Link>
          <Link href="/ofertas" onClick={() => setOpen(false)}>
            Ofertas
          </Link>
          <hr className="border-sun-100" />
          {role === "admin" && (
            <Link href="/dashboard/admin" onClick={() => setOpen(false)}>
              Panel admin
            </Link>
          )}
          {role === "cliente" && (
            <Link href="/dashboard/cliente" onClick={() => setOpen(false)}>
              Mi cuenta
            </Link>
          )}
          {role ? (
            <button onClick={handleLogout} className="text-left text-danger">
              Cerrar sesión
            </button>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>
                Ingresar
              </Link>
              <Link href="/registro" onClick={() => setOpen(false)}>
                Crear cuenta
              </Link>
            </>
          )}
          {adminProfile && <span className="text-xs text-ink-400">{adminProfile.email}</span>}
        </div>
      )}
    </header>
  );
}
