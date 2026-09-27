"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Newspaper } from "lucide-react";
import { ImagenSegura } from "@/components/shared/imagen-segura";
import { GaleriaLightbox } from "@/components/shared/galeria-lightbox";
import { Card } from "@/components/ui/card";
import { NoticiaConsultaBoton } from "@/components/noticias/noticia-consulta-boton";
import type { Noticia } from "@/types";

function formatearFecha(fecha: string): string {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Modal "ver noticia": se abre al hacer click en una noticia (desde el
 * widget lateral o cualquier listado) y muestra la foto grande + el
 * contenido completo, sin recortar (a diferencia de la vista previa que
 * usa line-clamp). Responsivo: en celulares ocupa casi toda la pantalla
 * y se puede cerrar con el botón X, tocando fuera de la tarjeta, o con
 * la tecla Escape.
 */
export function NoticiaDetalleModal({
  noticia,
  onClose,
}: {
  noticia: Noticia;
  onClose: () => void;
}) {
  // Se monta con un portal a document.body: el widget de noticias que
  // dispara este modal es flotante (position: fixed con su propio
  // z-index), así que si el modal se quedara anidado adentro quedaría
  // atrapado en ESE contexto de apilamiento y el navbar (también fixed/
  // sticky con z-index propio) podía terminar tapándolo. Portal +
  // z-index muy alto lo garantiza siempre por encima de todo.
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Evita que la página de atrás scrollee detrás del modal en mobile.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose]);

  if (!montado) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-ink-900/60 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={noticia.titulo}
    >
      <Card
        className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto p-0 relative rounded-b-none sm:rounded-b-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar noticia"
          className="absolute top-3 right-3 z-10 size-9 rounded-full bg-white/90 shadow flex items-center justify-center text-ink-600 hover:text-ink-900"
        >
          <X className="size-4" />
        </button>

        {noticia.imagenUrl && (
          <GaleriaLightbox imagenPrincipal={noticia.imagenUrl} nombre={noticia.titulo}>
            <div className="relative h-56 sm:h-80 w-full bg-ink-900 shrink-0 cursor-zoom-in">
              <ImagenSegura
                src={noticia.imagenUrl}
                alt={noticia.titulo}
                fill
                sizes="(max-width: 640px) 100vw, 672px"
                className="object-contain"
                priority
              />
            </div>
          </GaleriaLightbox>
        )}

        <div className="p-5 sm:p-6 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs text-clay-600 font-medium">
            <Newspaper className="size-3.5" />
            {formatearFecha(noticia.createdAt)}
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink-900 pr-6">
            {noticia.titulo}
          </h2>
          <p className="text-sm text-ink-600 whitespace-pre-line leading-relaxed">
            {noticia.contenido}
          </p>
          <div className="mt-2">
            <NoticiaConsultaBoton noticiaId={noticia.id} noticiaTitulo={noticia.titulo} />
          </div>
        </div>
      </Card>
    </div>,
    document.body,
  );
}
