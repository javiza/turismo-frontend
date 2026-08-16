"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { ImagenSegura } from "@/components/shared/imagen-segura";
import { GaleriaLightbox } from "@/components/shared/galeria-lightbox";
import { Carrusel, CarruselItem } from "@/components/shared/carrusel";
import { HeroSlider } from "@/components/shared/hero-slider";
import { PaqueteAcciones } from "@/components/paquetes/paquete-acciones";
import { PrecioPaquete } from "@/components/paquetes/precio-paquete";
import { NoticiasSidebar } from "@/components/noticias/noticias-sidebar";
import type { Paquete, Noticia } from "@/types";

function formatearFechaCorta(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-12 text-center text-ink-400 text-sm">
      {label}
    </div>
  );
}

function SkeletonCarrusel() {
  return (
    <div className="flex gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-72 w-[78%] sm:w-[340px] shrink-0 rounded-card bg-sun-100/60 animate-pulse" />
      ))}
    </div>
  );
}

// Home del cliente logueado: dos vitrinas para que apenas entre vea de
// un vistazo qué hay disponible para reservar/consultar (servicios) y
// qué se está publicando (noticias), sin tener que ir a cada pestaña.
export default function DashboardClienteHome() {
  const { data: paquetes, isLoading: cargandoPaquetes } = useQuery({
    queryKey: ["paquetes"],
    queryFn: () => apiFetch<Paquete[]>("/paquetes"),
  });

  const { data: noticias, isLoading: cargandoNoticias } = useQuery({
    queryKey: ["noticias"],
    queryFn: () => apiFetch<Noticia[]>("/noticias"),
  });

  return (
    <div className="flex flex-col gap-12">
      <HeroSlider />

      {/* Servicios + Noticias: las noticias van "a un costado" (columna
          lateral compacta, solo título y descripción) en vez de ser su
          propia vitrina de ancho completo. */}
      <section>
        <div
          className={
            noticias && noticias.length > 0 ? "grid lg:grid-cols-[1fr_320px] gap-10 items-start" : ""
          }
        >
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-ink-900">
                Servicios disponibles
              </h2>
              <p className="text-sm text-ink-600">
                Paquetes turísticos que puedes reservar o consultar ahora mismo.
              </p>
            </div>

            {cargandoPaquetes ? (
              <SkeletonCarrusel />
            ) : !paquetes || paquetes.length === 0 ? (
              <EmptyState label="Todavía no hay paquetes publicados." />
            ) : (
              <Carrusel>
                {paquetes.map((p) => (
                  <CarruselItem key={p.id}>
                    <Card className="overflow-hidden flex flex-col gap-3 p-0 h-full">
                      <GaleriaLightbox
                        imagenes={p.imagenes}
                        imagenPrincipal={p.imagenPrincipal}
                        nombre={p.nombre}
                      >
                        <div className="relative h-40 bg-sun-100">
                          {p.imagenPrincipal && (
                            <ImagenSegura
                              src={p.imagenPrincipal}
                              alt={p.nombre}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                      </GaleriaLightbox>
                      <div className="px-5 pb-5 flex flex-col gap-2 flex-1">
                        <h3 className="font-display text-lg font-semibold text-ink-900">
                          {p.nombre}
                        </h3>
                        <p className="text-sm text-ink-600 line-clamp-2">{p.descripcion}</p>

                        {p.destino && (
                          <p className="flex items-center gap-1.5 text-xs text-clay-600 font-medium">
                            <MapPin className="size-3.5 shrink-0" />
                            {p.destino.nombre} — {p.destino.ciudad}, {p.destino.pais}
                          </p>
                        )}

                        <p className="flex items-center gap-1.5 text-xs text-ink-400">
                          <CalendarDays className="size-3.5 shrink-0" />
                          Salida: {formatearFechaCorta(p.fechaInicio)}
                        </p>

                        <div className="mt-auto flex items-center justify-between pt-2">
                          <PrecioPaquete precio={p.precio} precioAnterior={p.precioAnterior} size="sm" />
                          <span className="text-xs text-ink-400">{p.cupos} cupos</span>
                        </div>

                        <PaqueteAcciones paqueteId={p.id} paqueteNombre={p.nombre} />
                      </div>
                    </Card>
                  </CarruselItem>
                ))}
              </Carrusel>
            )}
          </div>

          {cargandoNoticias ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-card bg-sun-100/60 animate-pulse" />
              ))}
            </div>
          ) : (
            <NoticiasSidebar noticias={noticias ?? []} />
          )}
        </div>
      </section>
    </div>
  );
}
