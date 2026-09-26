"use client";

import { useEffect, useState } from "react";
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
  Newspaper,
  GalleryHorizontal,
  PencilRuler,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useConsultasNoLeidas } from "@/hooks/use-consultas-no-leidas";
import { useProveedoresNoLeidos } from "@/hooks/use-proveedores-no-leidos";

const SERVICIOS = [
  { href: "/dashboard/admin/destinos", label: "Destinos", icon: MapPinned },
  { href: "/dashboard/admin/paquetes", label: "Paquetes", icon: Package },
  { href: "/dashboard/admin/ofertas", label: "Ofertas", icon: Tag },
];

const EDICION_APP = [
  { href: "/dashboard/admin/contenido", label: "Contenido home", icon: FileText },
  { href: "/dashboard/admin/slides", label: "Slide de portada", icon: GalleryHorizontal },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const noLeidas = useConsultasNoLeidas();
  const proveedoresNoLeidos = useProveedoresNoLeidos();
  const pathname = usePathname();

  const servicioActivo = SERVICIOS.some((s) => pathname.startsWith(s.href));
  const [serviciosAbierto, setServiciosAbierto] = useState(servicioActivo);

  const edicionActiva = EDICION_APP.some((s) => pathname.startsWith(s.href));
  const [edicionAbierta, setEdicionAbierta] = useState(edicionActiva);

  // Menú lateral tipo "cajón" (drawer) para celulares: en pantallas chicas
  // el sidebar de escritorio se oculta y el contenido pasa a ancho
  // completo; este estado controla el panel que aparece al tocar el
  // botón hamburguesa. En lg+ no se usa (el sidebar de siempre queda fijo
  // y visible).
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cierra el cajón al cambiar de página (tocar un link).
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  const navContent = (
    <nav className="flex flex-col gap-1 text-sm">
      <Link
        href="/dashboard/admin"
        onClick={cerrarMenu}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
      >
        <LayoutDashboard className="size-4" />
        Inicio
      </Link>
      <Link
        href="/dashboard/admin/noticias"
        onClick={cerrarMenu}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
      >
        <Newspaper className="size-4" />
        Noticias
      </Link>
      <Link
        href="/dashboard/admin/reservas"
        onClick={cerrarMenu}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
      >
        <CalendarCheck className="size-4" />
        Reservas
      </Link>
      <Link
        href="/dashboard/admin/finanzas"
        onClick={cerrarMenu}
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
                onClick={cerrarMenu}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${
                  activo ? "bg-clay-500 text-white" : "text-ink-800 hover:bg-sun-100"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setEdicionAbierta((v) => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium w-full text-left ${
          edicionActiva ? "text-clay-600" : "text-ink-800 hover:bg-sun-100"
        }`}
        aria-expanded={edicionAbierta}
      >
        <PencilRuler className="size-4" />
        Edición app
        <ChevronDown
          className={`size-4 ml-auto transition-transform ${edicionAbierta ? "rotate-180" : ""}`}
        />
      </button>
      {edicionAbierta && (
        <div className="flex flex-col gap-1 pl-4 border-l border-sun-200 ml-4">
          {EDICION_APP.map(({ href, label, icon: Icon }) => {
            const activo = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={cerrarMenu}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${
                  activo ? "bg-clay-500 text-white" : "text-ink-800 hover:bg-sun-100"
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
        href="/dashboard/admin/consultas-clientes"
        onClick={cerrarMenu}
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
        onClick={cerrarMenu}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
      >
        <MailQuestion className="size-4" />
        Consultas IA
      </Link>
      <Link
        href="/dashboard/admin/proveedores"
        onClick={cerrarMenu}
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
        onClick={cerrarMenu}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
      >
        <Users className="size-4" />
        Usuarios
      </Link>
      <Link
        href="/dashboard/admin/configuracion"
        onClick={cerrarMenu}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
      >
        <Settings className="size-4" />
        Configuración
      </Link>
      <Link
        href="/dashboard/admin/cuenta"
        onClick={cerrarMenu}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium mt-2 border-t border-sun-200 pt-3"
      >
        <KeyRound className="size-4" />
        Mi cuenta
      </Link>
    </nav>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 lg:py-10">
      {/* Barra superior solo en móvil/tablet: logo + botón hamburguesa.
          El sidebar fijo de escritorio (aside de abajo) se oculta bajo
          el breakpoint lg, así que esta es la única forma de navegar
          entre secciones del panel en pantallas chicas. */}
      <div className="flex lg:hidden items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-clay-600">
          <Compass className="size-5" />
          <span className="font-display font-semibold">Panel admin</span>
        </div>
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          className="p-2 rounded-lg hover:bg-sun-100 text-ink-800"
        >
          <Menu className="size-6" />
        </button>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
         <aside className="hidden lg:block lg:sticky lg:top-24 h-max max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 scrollbar-fina">
          <div className="flex items-center gap-2 mb-6 text-clay-600">
            <Compass className="size-5" />
            <span className="font-display font-semibold">Panel admin</span>
          </div>
          {navContent}
        </aside>

        {/* Cajón deslizante para móvil/tablet: overlay + panel a la
            izquierda con el mismo contenido de navegación. Se cierra
            tocando la X, el fondo oscuro, o cualquier link. */}
        {menuAbierto && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={cerrarMenu}
              className="absolute inset-0 bg-ink-900/40"
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl overflow-y-auto px-4 py-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-clay-600">
                  <Compass className="size-5" />
                  <span className="font-display font-semibold">Panel admin</span>
                </div>
                <button
                  type="button"
                  onClick={cerrarMenu}
                  aria-label="Cerrar menú"
                  className="p-2 rounded-lg hover:bg-sun-100 text-ink-800"
                >
                  <X className="size-5" />
                </button>
              </div>
              {navContent}
            </div>
          </div>
        )}

        {/* min-w-0 evita que tablas/formularios anchos dentro de cada
            página empujen el layout a lo ancho en celulares. */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
