"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { CalendarDays, MessageSquareText, User, Wallet, MapPin } from "lucide-react";
import type { Cliente, Reserva, Cotizacion } from "@/types";

const estadoStyles: Record<string, string> = {
  PENDIENTE: "bg-sun-200 text-sun-800",
  CONFIRMADA: "bg-success/15 text-success",
  RESPONDIDA: "bg-info/15 text-info",
  CANCELADA: "bg-danger/15 text-danger",
  CERRADA: "bg-ink-100 text-ink-600",
};

const estadoReservaTexto: Record<string, string> = {
  PENDIENTE: "Pendiente de confirmación",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
};

function formatoCLP(valor: number): string {
  return `$${Math.round(valor).toLocaleString("es-CL")}`;
}

export default function DashboardClientePage() {
  const { data: perfil } = useQuery({
    queryKey: ["cliente-perfil"],
    queryFn: () => apiFetch<Cliente>("/clientes-auth/perfil"),
  });

  const { data: reservas, isLoading: loadingReservas } = useQuery({
    queryKey: ["mis-reservas"],
    queryFn: () => apiFetch<Reserva[]>("/clientes-auth/mis-reservas"),
  });

  const { data: cotizaciones, isLoading: loadingCotizaciones } = useQuery({
    queryKey: ["mis-cotizaciones"],
    queryFn: () => apiFetch<Cotizacion[]>("/clientes-auth/mis-cotizaciones"),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="size-12 rounded-full bg-clay-500 text-white flex items-center justify-center">
          <User className="size-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Hola, {perfil?.nombre ?? "..."}
          </h1>
          <p className="text-sm text-ink-600">{perfil?.email}</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink-900 mb-4">
          <CalendarDays className="size-5 text-clay-600" />
          Mis reservas
        </h2>

        {loadingReservas ? (
          <SkeletonList />
        ) : !reservas || reservas.length === 0 ? (
          <EmptyState label="Aún no tienes reservas. Explora los paquetes disponibles." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {reservas.map((r) => (
              <Card key={r.id} className="p-5 flex gap-4">
                {r.paquete?.imagenPrincipal && (
                  <div className="relative size-16 rounded-xl overflow-hidden shrink-0 bg-sun-100">
                    <Image
                      src={r.paquete.imagenPrincipal}
                      alt={r.paquete.nombre}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-ink-900">
                      {r.paquete?.nombre ?? `Paquete #${r.paqueteId}`}
                    </h3>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${estadoStyles[r.estado] ?? "bg-ink-100"}`}
                    >
                      {estadoReservaTexto[r.estado] ?? r.estado}
                    </span>
                  </div>
                  {r.paquete && (
                    <p className="text-xs text-ink-400 mt-1 flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {r.paquete.fechaInicio} — {r.paquete.fechaFin}
                    </p>
                  )}
                  <p className="text-sm text-ink-600 mt-2">
                    {r.cantidadPersonas} persona(s) · reservada el{" "}
                    {new Date(r.fechaReserva).toLocaleDateString("es-CL")}
                  </p>
                  {r.montoTotal != null && (
                    <p className="text-sm font-semibold text-ink-900 mt-2 flex items-center gap-1.5">
                      <Wallet className="size-4 text-clay-600" />
                      {formatoCLP(r.montoTotal)}
                      {r.estado === "PENDIENTE" && (
                        <span className="text-xs font-normal text-ink-400">
                          (a confirmar por la agencia)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink-900 mb-4">
          <MessageSquareText className="size-5 text-clay-600" />
          Mis cotizaciones
        </h2>

        {loadingCotizaciones ? (
          <SkeletonList />
        ) : !cotizaciones || cotizaciones.length === 0 ? (
          <EmptyState label="Todavía no has enviado ninguna cotización." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {cotizaciones.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {(c.paquete || c.destino) && (
                      <p className="text-xs font-medium text-clay-600 mb-1 flex items-center gap-1 truncate">
                        <MapPin className="size-3.5 shrink-0" />
                        {c.paquete?.nombre ?? c.destino?.nombre}
                      </p>
                    )}
                    <p className="text-sm text-ink-900 line-clamp-2">{c.mensaje}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${estadoStyles[c.estado] ?? "bg-ink-100"}`}
                  >
                    {c.estado}
                  </span>
                </div>
                <p className="text-xs text-ink-400 mt-2">
                  Enviada el {new Date(c.createdAt).toLocaleDateString("es-CL")}
                </p>
                {c.respuesta ? (
                  <div className="mt-3 rounded-lg bg-info/10 p-3">
                    <p className="text-xs font-medium text-info mb-1">Respuesta del equipo</p>
                    <p className="text-sm text-ink-800">{c.respuesta}</p>
                    {c.respondidoEn && (
                      <p className="text-xs text-ink-400 mt-1">
                        {new Date(c.respondidoEn).toLocaleDateString("es-CL")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-ink-400 mt-3 italic">
                    Todavía sin respuesta. Nuestro equipo te contactará pronto.
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-12 text-center text-ink-400 text-sm">
      {label}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="h-24 rounded-card bg-sun-100/60 animate-pulse" />
      ))}
    </div>
  );
}
