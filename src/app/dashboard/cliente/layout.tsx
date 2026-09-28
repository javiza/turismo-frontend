"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { SkyBackground } from "@/components/shared/sky-background";
import { Compass, Luggage, IdCard, User, Home, Menu, X } from "lucide-react";
import type { Cliente, ContenidoHome } from "@/types";

const LINKS = [
  { href: "/dashboard/cliente", label: "Inicio", icon: Home },
  { href: "/dashboard/cliente/viajes", label: "Mis viajes", icon: Luggage },
  { href: "/dashboard/cliente/cuenta", label: "Mi cuenta", icon: IdCard },
];

export default function DashboardClienteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const { data: perfil } = useQuery({
    queryKey: ["cliente-perfil"],
    queryFn: () => apiFetch<Cliente>("/clientes-auth/perfil"),
  });

  // Mismo contenido editable desde el panel admin que usa la home
  // pública, solo para reutilizar la imagen/encuadre del hero en el
  // banner de esta sección (no requiere login de admin: es el mismo
  // endpoint público que consume la home).
  const { data: contenido } = useQuery({
    queryKey: ["contenido-home"],
    queryFn: () => apiFetch<ContenidoHome>("/contenido-home"),
  });

  // Menú lateral tipo "cajón" (drawer) para celulares y tablets, igual
  // que en el panel admin: bajo el breakpoint lg el sidebar de escritorio
  // se oculta y este estado controla el panel que aparece al tocar el
  // botón hamburguesa.
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cierra el cajón al cambiar de página (tocar un link).
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  // Con el cajón abierto: bloquea el scroll de la página de fondo y
  // permite cerrarlo con la tecla Escape.
  useEffect(() => {
    if (!menuAbierto) return;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuAbierto(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuAbierto]);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  const navContent = (
    <nav className="flex flex-col gap-1 text-sm">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const activo =
          href === "/dashboard/cliente" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={cerrarMenu}
            aria-current={activo ? "page" : undefined}
            className={`flex items-center gap-2 px-3 py-2.5 lg:py-2 rounded-lg font-medium transition-colors ${
              activo ? "bg-clay-500 text-white" : "text-ink-800 hover:bg-sun-100"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 lg:py-10">
      <SkyBackground className="fixed inset-0 -z-10 opacity-90" />

      {/* Barra superior solo en móvil/tablet: título + botón hamburguesa.
          El sidebar fijo de escritorio (aside de abajo) se oculta bajo
          el breakpoint lg, así que esta es la forma de navegar entre
          secciones del panel en pantallas chicas. */}
      <div className="flex lg:hidden items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-clay-600">
          <Compass className="size-5" />
          <span className="font-display font-semibold">Mi panel</span>
        </div>
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          className="p-2 -mr-2 rounded-lg hover:bg-sun-100 text-ink-800"
        >
          <Menu className="size-6" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6 lg:mb-8">
        <div className="size-11 sm:size-12 rounded-full bg-clay-500 text-white flex items-center justify-center shrink-0">
          <User className="size-5 sm:size-6" />
        </div>
        {/* min-w-0 + truncate: un nombre o email largo no debe empujar
            el ancho de la página en celulares. */}
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink-900 truncate">
            Hola, {perfil?.nombre ?? "..."}
          </h1>
          <p className="text-sm text-ink-600 truncate">{perfil?.email}</p>
        </div>
      </div>

      {/* Banner con foto de playa — mismo look del hero del home. */}
      <div className="relative mb-8 lg:mb-10 h-32 sm:h-52 rounded-card overflow-hidden">
        <Image
          src={contenido?.heroImagenUrl || "/images/hero-playa.webp"}
          alt=""
          fill
          aria-hidden="true"
          className="object-cover"
          style={{
            objectPosition: `${contenido?.heroImagenPosX ?? 50}% ${contenido?.heroImagenPosY ?? 50}%`,
            transform: `scale(${(contenido?.heroImagenZoom ?? 100) / 100})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/20 to-transparent" />
        <div className="relative h-full flex items-end p-4 sm:p-5">
          <p className="font-display text-base sm:text-xl font-semibold text-white drop-shadow-sm">
            Tus próximas vacaciones empiezan aquí
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="hidden lg:block lg:sticky lg:top-24 h-max">
          <div className="flex items-center gap-2 mb-6 text-clay-600">
            <Compass className="size-5" />
            <span className="font-display font-semibold">Mi panel</span>
          </div>
          {navContent}
        </aside>

        {/* Cajón deslizante para móvil/tablet: overlay + panel a la
            izquierda con el mismo contenido de navegación. Se cierra
            tocando la X, el fondo oscuro, Escape o cualquier link. */}
        {menuAbierto && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de mi panel">
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
                  <span className="font-display font-semibold">Mi panel</span>
                </div>
                <button
                  type="button"
                  onClick={cerrarMenu}
                  aria-label="Cerrar menú"
                  className="p-2 -mr-2 rounded-lg hover:bg-sun-100 text-ink-800"
                >
                  <X className="size-5" />
                </button>
              </div>
              {navContent}
            </div>
          </div>
        )}

        {/* min-w-0 evita que tablas/carruseles anchos dentro de cada
            página empujen el layout a lo ancho en celulares. */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
