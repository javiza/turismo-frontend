"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, ChevronLeft, ChevronRight, MapPin, Newspaper, Percent } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { ImagenSegura } from "@/components/shared/imagen-segura";
import { DetalleSlideModal } from "@/components/shared/detalle-slide-modal";
import type { HomeSlide, TipoSlide } from "@/types";

const ETIQUETA_TIPO: Record<TipoSlide, { label: string; icon: React.ElementType }> = {
  destino: { label: "Destino", icon: MapPin },
  paquete: { label: "Paquete", icon: CalendarRange },
  oferta: { label: "Oferta", icon: Percent },
  noticia: { label: "Noticia", icon: Newspaper },
};

function formatearFecha(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

function precioLabel(slide: HomeSlide): string | null {
  if (slide.tipo === "oferta" && slide.descuento != null) {
    if (slide.precio != null) {
      const conDescuento = Number(slide.precio) * (1 - Number(slide.descuento) / 100);
      return `$${conDescuento.toLocaleString("es-CL", { maximumFractionDigits: 0 })} (-${Number(slide.descuento)}%)`;
    }
    return `-${Number(slide.descuento)}% de descuento`;
  }
  if (slide.precio == null) return null;
  const prefijo = slide.tipo === "destino" ? "Desde " : "";
  return `${prefijo}$${Number(slide.precio).toLocaleString("es-CL", { maximumFractionDigits: 0 })}`;
}

const INTERVALO_AUTOPLAY_MS = 6000;

/**
 * Banner destacado de la sección "Inicio" del cliente logueado: un slide
 * a pantalla ancha por vez, con la vitrina que el admin arma desde
 * /dashboard/admin/contenido (destinos, paquetes, ofertas o noticias
 * elegidos a mano — ver /slides/publico). Al hacer click se abre el
 * detalle completo del servicio en un modal (ver DetalleSlideModal).
 *
 * Si el admin no configuró ningún slide, este componente no renderiza
 * nada (la home del cliente sigue mostrando las vitrinas de siempre
 * debajo, sin un hueco vacío arriba).
 */
export function HeroSlider() {
  const { data: slides, isLoading } = useQuery({
    queryKey: ["slides-publico"],
    queryFn: () => apiFetch<HomeSlide[]>("/slides/publico"),
  });

  const [indice, setIndice] = useState(0);
  const [detalle, setDetalle] = useState<{ tipo: TipoSlide; id: number } | null>(null);

  const total = slides?.length ?? 0;

  // Reinicia el índice si la lista cambia de tamaño (evita quedar
  // apuntando a un slide que ya no existe).
  useEffect(() => {
    setIndice(0);
  }, [total]);

  // Autoplay: avanza solo mientras haya más de un slide y no haya un
  // modal de detalle abierto (no tiene sentido cambiar el fondo detrás
  // del usuario mientras está leyendo).
  useEffect(() => {
    if (total <= 1 || detalle) return;
    const t = setInterval(() => setIndice((i) => (i + 1) % total), INTERVALO_AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [total, detalle]);

  if (isLoading) {
    return <div className="h-72 sm:h-80 rounded-card bg-sun-100/60 animate-pulse" />;
  }

  if (!slides || slides.length === 0) {
    return null;
  }

  const slide = slides[indice];
  const { label, icon: Icon } = ETIQUETA_TIPO[slide.tipo];
  const precio = precioLabel(slide);

  return (
    <section>
      <div className="relative h-72 sm:h-80 rounded-card overflow-hidden group">
        <button
          type="button"
          onClick={() => setDetalle({ tipo: slide.tipo, id: slide.referenciaId })}
          className="absolute inset-0 w-full h-full text-left"
          aria-label={`Ver detalle de ${slide.titulo}`}
        >
          <div className="absolute inset-0 bg-sun-200">
            {slide.imagen && (
              <ImagenSegura src={slide.imagen} alt={slide.titulo} fill className="object-cover" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/25 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 flex flex-col gap-2 text-white max-w-2xl">
            <span className="inline-flex items-center gap-1.5 w-max text-xs font-medium bg-white/15 backdrop-blur px-2.5 py-1 rounded-full">
              <Icon className="size-3.5" />
              {label}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">{slide.titulo}</h2>
            <p className="text-sm text-white/85 line-clamp-2">{slide.descripcion}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-1">
              {precio && <span className="font-display font-semibold text-sun-200">{precio}</span>}
              {slide.fechaInicio && slide.fechaFin && (
                <span className="flex items-center gap-1.5 text-white/80 text-xs">
                  <CalendarRange className="size-3.5" />
                  Salida {formatearFecha(slide.fechaInicio)} — Fin {formatearFecha(slide.fechaFin)}
                </span>
              )}
            </div>
          </div>
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndice((i) => (i - 1 + total) % total)}
              aria-label="Slide anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setIndice((i) => (i + 1) % total)}
              aria-label="Slide siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute top-4 right-4 flex gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndice(i)}
                  aria-label={`Ir al slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === indice ? "w-6 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {detalle && (
        <DetalleSlideModal
          tipo={detalle.tipo}
          id={detalle.id}
          onClose={() => setDetalle(null)}
        />
      )}
    </section>
  );
}
