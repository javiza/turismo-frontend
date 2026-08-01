"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MailQuestion,
  MessagesSquare,
  Compass,
  MapPinned,
  Package,
  Tag,
  FileText,
  CalendarCheck,
  Wallet,
  Building2,
  Users,
  KeyRound,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import { useConsultasNoLeidas } from "@/hooks/use-consultas-no-leidas";
import { useProveedoresNoLeidos } from "@/hooks/use-proveedores-no-leidos";

const SERVICIOS = [
  { href: "/dashboard/admin/destinos", label: "Destinos", icon: MapPinned },
  { href: "/dashboard/admin/paquetes", label: "Paquetes", icon: Package },
  { href: "/dashboard/admin/ofertas", label: "Ofertas", icon: Tag },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const noLeidas = useConsultasNoLeidas();
  const proveedoresNoLeidos = useProveedoresNoLeidos();
  const pathname = usePathname();

  const servicioActivo = SERVICIOS.some((s) => pathname.startsWith(s.href));
  const [serviciosAbierto, setServiciosAbierto] = useState(servicioActivo);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid lg:grid-cols-[220px_1fr] gap-8">
      <aside className="lg:sticky lg:top-24 h-max">
        <div className="flex items-center gap-2 mb-6 text-clay-600">
          <Compass className="size-5" />
          <span className="font-display font-semibold">Panel admin</span>
        </div>
        <nav className="flex lg:flex-col gap-1 text-sm">
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <LayoutDashboard className="size-4" />
            Big data
          </Link>
          <Link
            href="/dashboard/admin/reservas"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <CalendarCheck className="size-4" />
            Reservas
          </Link>
          <Link
            href="/dashboard/admin/finanzas"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <Wallet className="size-4" />
            Finanzas
          </Link>

          <button
            type="button"
            onClick={() => setServiciosAbierto((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium w-full text-left ${
              servicioActivo ? "text-clay-600" : "text-ink-800 hover:bg-sun-100"
            }`}
            aria-expanded={serviciosAbierto}
          >
            <ClipboardList className="size-4" />
            Ingresar servicio
            <ChevronDown
              className={`size-4 ml-auto transition-transform ${serviciosAbierto ? "rotate-180" : ""}`}
            />
          </button>
          {serviciosAbierto && (
            <div className="flex flex-col gap-1 pl-4 border-l border-sun-200 ml-4">
              {SERVICIOS.map(({ href, label, icon: Icon }) => {
                const activo = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${
                      activo
                        ? "bg-clay-500 text-white"
                        : "text-ink-800 hover:bg-sun-100"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            href="/dashboard/admin/contenido"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <FileText className="size-4" />
            Contenido home
          </Link>
          <Link
            href="/dashboard/admin/consultas-clientes"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <MessagesSquare className="size-4" />
            Consultas clientes
            {noLeidas > 0 && (
              <span className="ml-auto flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-clay-500 text-white text-[11px] font-semibold">
                {noLeidas > 99 ? "99+" : noLeidas}
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/admin/consultas"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <MailQuestion className="size-4" />
            Consultas IA
          </Link>
          <Link
            href="/dashboard/admin/proveedores"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <Building2 className="size-4" />
            Proveedores
            {proveedoresNoLeidos > 0 && (
              <span className="ml-auto flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-clay-500 text-white text-[11px] font-semibold">
                {proveedoresNoLeidos > 99 ? "99+" : proveedoresNoLeidos}
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/admin/usuarios"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <Users className="size-4" />
            Usuarios
          </Link>
          <Link
            href="/dashboard/admin/cuenta"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium mt-2 border-t border-sun-200 pt-3"
          >
            <KeyRound className="size-4" />
            Mi cuenta
          </Link>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
