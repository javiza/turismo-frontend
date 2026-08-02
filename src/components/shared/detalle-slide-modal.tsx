"use client";

import { useQuery } from "@tanstack/react-query";
import { X, MapPin, CalendarRange, Percent, Newspaper } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { ImagenSegura } from "@/components/shared/imagen-segura";
import { GaleriaLightbox } from "@/components/shared/galeria-lightbox";
import { PrecioPaquete } from "@/components/paquetes/precio-paquete";
import { PrecioDestino } from "@/components/destinos/precio-destino";
import { DisponibilidadDestino } from "@/components/destinos/disponibilidad-destino";
import { DestinoAcciones } from "@/components/destinos/destino-acciones";
import { PaqueteAcciones } from "@/components/paquetes/paquete-acciones";
import { NoticiaConsultaBoton } from "@/components/noticias/noticia-consulta-boton";
import type { TipoSlide, Destino, Paquete, Oferta, Noticia } from "@/types";

const RUTA_POR_TIPO: Record<TipoSlide, string> = {
  destino: "/destinos",
  paquete: "/paquetes",
  oferta: "/ofertas",
  noticia: "/noticias",
};

function formatearFecha(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Modal "ver todo" que se abre al hacer click en un slide del carrusel
 * de portada (dashboard/cliente): trae el detalle completo del servicio
 * referenciado (no solo el resumen que trae /slides/publico) y lo
 * muestra con la misma acción de reservar/consultar que tiene su
 * listado público, para que el cliente pueda actuar sin salir del modal.
 */
export function DetalleSlideModal({
  tipo,
  id,
  onClose,
}: {
  tipo: TipoSlide;
  id: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 px-4 py-8">
      <Card className="w-full max-w-2xl max-h-full overflow-y-auto p-0 relative">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 size-8 rounded-full bg-white/90 shadow flex items-center justify-center text-ink-600 hover:text-ink-900"
        >
          <X className="size-4" />
        </button>

        {tipo === "destino" && <DetalleDestino id={id} />}
        {tipo === "paquete" && <DetallePaquete id={id} />}
        {tipo === "oferta" && <DetalleOferta id={id} />}
        {tipo === "noticia" && <DetalleNoticia id={id} />}
      </Card>
    </div>
  );
}

function SkeletonDetalle() {
  return (
    <div className="p-6">
      <div className="h-56 rounded-card bg-sun-100/60 animate-pulse mb-4" />
      <div className="h-6 w-2/3 rounded bg-sun-100/60 animate-pulse mb-2" />
      <div className="h-4 w-full rounded bg-sun-100/60 animate-pulse mb-1" />
      <div className="h-4 w-5/6 rounded bg-sun-100/60 animate-pulse" />
    </div>
  );
}

function DetalleDestino({ id }: { id: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["destino-detalle", id],
    queryFn: () => apiFetch<Destino>(`/destinos/${id}`),
  });

  if (isLoading || !data) return <SkeletonDetalle />;
  const d = data;

  return (
    <div>
      <GaleriaLightbox imagenes={d.imagenes} imagenPrincipal={d.imagenPrincipal} nombre={d.nombre}>
        <div className="relative h-56 bg-sun-100 rounded-t-card overflow-hidden">
          {d.imagenPrincipal && (
            <ImagenSegura src={d.imagenPrincipal} alt={d.nombre} fill className="object-cover" />
          )}
        </div>
      </GaleriaLightbox>
      <div className="p-6 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs text-clay-600 font-medium">
          <MapPin className="size-3.5" />
          {d.ciudad}, {d.pais}
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink-900 pr-6">{d.nombre}</h2>
        <p className="text-sm text-ink-600 whitespace-pre-line">{d.descripcion}</p>
        <PrecioDestino precioDesde={d.precioDesde} size="lg" />
        <DisponibilidadDestino fechaInicio={d.fechaInicio} fechaFin={d.fechaFin} />
        <DestinoAcciones destinoId={d.id} destinoNombre={d.nombre} />
      </div>
    </div>
  );
}

function DetallePaquete({ id }: { id: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["paquete-detalle", id],
    queryFn: () => apiFetch<Paquete>(`/paquetes/${id}`),
  });

  if (isLoading || !data) return <SkeletonDetalle />;
  const p = data;

  return (
    <div>
      <GaleriaLightbox imagenes={p.imagenes} imagenPrincipal={p.imagenPrincipal} nombre={p.nombre}>
        <div className="relative h-56 bg-sun-100 rounded-t-card overflow-hidden">
          {p.imagenPrincipal && (
            <ImagenSegura src={p.imagenPrincipal} alt={p.nombre} fill className="object-cover" />
          )}
        </div>
      </GaleriaLightbox>
      <div className="p-6 flex flex-col gap-3">
        {p.destino && (
          <div className="flex items-center gap-1.5 text-xs text-clay-600 font-medium">
            <MapPin className="size-3.5" />
            {p.destino.nombre} — {p.destino.ciudad}, {p.destino.pais}
          </div>
        )}
        <h2 className="font-display text-2xl font-semibold text-ink-900 pr-6">{p.nombre}</h2>
        <p className="text-sm text-ink-600 whitespace-pre-line">{p.descripcion}</p>
        <PrecioPaquete precio={p.precio} precioAnterior={p.precioAnterior} size="lg" />
        <p className="flex items-center gap-1.5 text-xs text-ink-500">
          <CalendarRange className="size-3.5 shrink-0" />
          Salida: {formatearFecha(p.fechaInicio)} · Regreso: {formatearFecha(p.fechaFin)}
        </p>
        <p className="text-xs text-ink-400">{p.cupos} cupos disponibles</p>
        <PaqueteAcciones paqueteId={p.id} paqueteNombre={p.nombre} />
      </div>
    </div>
  );
}

function DetalleOferta({ id }: { id: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["oferta-detalle", id],
    queryFn: () => apiFetch<Oferta>(`/ofertas/${id}`),
  });

  if (isLoading || !data) return <SkeletonDetalle />;
  const o = data;
  const precioBase = o.paquete ? Number(o.paquete.precio) : undefined;
  const precioConDescuento =
    precioBase != null ? Number((precioBase * (1 - Number(o.descuento) / 100)).toFixed(2)) : undefined;

  return (
    <div>
      <GaleriaLightbox
        imagenes={o.imagenes}
        imagenPrincipal={o.imagenPrincipal ?? o.paquete?.imagenPrincipal}
        nombre={o.titulo}
      >
        <div className="relative h-56 bg-sun-100 rounded-t-card overflow-hidden">
          {(o.imagenPrincipal ?? o.paquete?.imagenPrincipal) && (
            <ImagenSegura
              src={(o.imagenPrincipal ?? o.paquete?.imagenPrincipal) as string}
              alt={o.titulo}
              fill
              className="object-cover"
            />
          )}
        </div>
      </GaleriaLightbox>
      <div className="p-6 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs text-clay-600 font-medium">
          <Percent className="size-3.5" />
          {Number(o.descuento)}% de descuento
          {o.paquete && <> · {o.paquete.nombre}</>}
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink-900 pr-6">{o.titulo}</h2>
        {o.descripcion && <p className="text-sm text-ink-600 whitespace-pre-line">{o.descripcion}</p>}
        {precioBase != null && precioConDescuento != null && (
          <PrecioPaquete precio={precioConDescuento} precioAnterior={precioBase} size="lg" />
        )}
        <p className="flex items-center gap-1.5 text-xs text-ink-500">
          <CalendarRange className="size-3.5 shrink-0" />
          Vigente del {formatearFecha(o.fechaInicio)} al {formatearFecha(o.fechaFin)}
        </p>
        {o.paquete && <PaqueteAcciones paqueteId={o.paquete.id} paqueteNombre={o.paquete.nombre} />}
      </div>
    </div>
  );
}

function DetalleNoticia({ id }: { id: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["noticia-detalle", id],
    queryFn: () => apiFetch<Noticia>(`/noticias/${id}`),
  });

  if (isLoading || !data) return <SkeletonDetalle />;
  const n = data;

  return (
    <div>
      {n.imagenUrl && (
        <div className="relative h-56 bg-sun-100 rounded-t-card overflow-hidden">
          <ImagenSegura src={n.imagenUrl} alt={n.titulo} fill className="object-cover" />
        </div>
      )}
      <div className="p-6 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs text-clay-600 font-medium">
          <Newspaper className="size-3.5" />
          {formatearFecha(n.createdAt)}
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink-900 pr-6">{n.titulo}</h2>
        <p className="text-sm text-ink-600 whitespace-pre-line">{n.contenido}</p>
        <NoticiaConsultaBoton noticiaId={n.id} noticiaTitulo={n.titulo} />
      </div>
    </div>
  );
}

// Ruta pública equivalente (listados) — se puede usar como fallback de
// navegación desde fuera del dashboard si en algún momento se agrega un
// botón "ver listado completo" junto al slide.
export function rutaListadoDeTipo(tipo: TipoSlide): string {
  return RUTA_POR_TIPO[tipo];
}
