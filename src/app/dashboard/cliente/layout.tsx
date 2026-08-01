"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { SkyBackground } from "@/components/shared/sky-background";
import { Compass, Luggage, IdCard, User } from "lucide-react";
import type { Cliente, ContenidoHome } from "@/types";

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

  const links = [
    { href: "/dashboard/cliente/viajes", label: "Mis viajes", icon: Luggage },
    { href: "/dashboard/cliente/cuenta", label: "Mi cuenta", icon: IdCard },
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <SkyBackground className="fixed inset-0 -z-10 opacity-90" />

      <div className="flex items-center gap-3 mb-8">
        <div className="size-12 rounded-full bg-clay-500 text-white flex items-center justify-center shrink-0">
          <User className="size-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Hola, {perfil?.nombre ?? "..."}
          </h1>
          <p className="text-sm text-ink-600">{perfil?.email}</p>
        </div>
      </div>

      {/* Banner con foto de playa — mismo look del hero del home. */}
      <div className="relative mb-10 h-40 sm:h-52 rounded-card overflow-hidden">
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
        <div className="relative h-full flex items-end p-5">
          <p className="font-display text-lg sm:text-xl font-semibold text-white drop-shadow-sm">
            Tus próximas vacaciones empiezan aquí
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="lg:sticky lg:top-24 h-max">
          <div className="flex items-center gap-2 mb-6 text-clay-600">
            <Compass className="size-5" />
            <span className="font-display font-semibold">Mi panel</span>
          </div>
          <nav className="flex lg:flex-col gap-1 text-sm">
            {links.map(({ href, label, icon: Icon }) => {
              const activo = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
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
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
