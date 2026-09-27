"use client";

import { useState } from "react";
import { Newspaper, ChevronDown, X } from "lucide-react";
import { ImagenSegura } from "@/components/shared/imagen-segura";
import { NoticiaDetalleModal } from "@/components/noticias/noticia-detalle-modal";
import { cn } from "@/lib/cn";
import type { Noticia } from "@/types";

/**
 * Widget FLOTANTE de noticias: se fija en la esquina de la pantalla
 * (position: fixed) y acompaña al visitante en toda la página, desde
 * que entra, sin importar cuánto scrollee — no ocupa espacio en el
 * layout ni depende de en qué parte del árbol se renderice.
 *
 * - Desplegable: el título hace de acordeón para mostrar/ocultar la
 *   lista sin perder el widget de la pantalla; cuando está contraído
 *   queda como una píldora chica para no tapar contenido.
 * - Botón X: si de todos modos estorba, se puede cerrar del todo. En
 *   su lugar queda un botón circular pequeño, en la misma esquina, que
 *   vuelve a abrir el panel completo con un click (no se pierde del
 *   todo, solo se reduce a su mínima expresión).
 * - Click en una noticia: abre un modal con la foto grande + la
 *   descripción completa (sin recortar).
 */
export function NoticiasSidebar({
  noticias,
  titulo = "Últimas noticias",
}: {
  noticias: Noticia[];
  titulo?: string;
}) {
  const [visible, setVisible] = useState(true);
  const [expandido, setExpandido] = useState(true);
  const [noticiaAbierta, setNoticiaAbierta] = useState<Noticia | null>(null);

  if (noticias.length === 0) return null;

  // El panel se cerró del todo: dejamos un botón flotante chico, en la
  // misma esquina, para volver a abrirlo sin recargar la página.
  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => {
          setVisible(true);
          setExpandido(true);
        }}
        aria-label={`Mostrar noticias (${noticias.length})`}
        title="Mostrar noticias"
        className="fixed z-40 bottom-3 right-3 sm:bottom-6 sm:right-6 size-14 rounded-full bg-tarjeta-app border border-sun-200 shadow-xl shadow-ink-900/15 flex items-center justify-center text-clay-600 hover:scale-105 transition-transform"
      >
        <Newspaper className="size-6" />
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-clay-600 text-white text-[10px] font-semibold px-1">
          {noticias.length}
        </span>
      </button>
    );
  }

  return (
    <aside
      className={cn(
        "fixed z-40 bottom-3 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6",
        "w-auto sm:w-80 flex flex-col overflow-hidden",
        "rounded-2xl border border-sun-200 bg-tarjeta-app shadow-xl shadow-ink-900/15",
        expandido ? "max-h-[70vh]" : "",
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
          className="flex flex-1 items-center gap-2 text-left text-ink-900 min-w-0"
        >
          <span className="relative shrink-0 flex items-center justify-center size-8 rounded-full bg-clay-600/10">
            <Newspaper className="size-4 text-clay-600" />
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-clay-600 text-white text-[10px] font-semibold px-1">
              {noticias.length}
            </span>
          </span>
          <h3 className="font-display text-sm sm:text-base font-semibold truncate">{titulo}</h3>
          <ChevronDown
            className={cn(
              "size-4 text-ink-400 shrink-0 transition-transform ml-auto",
              expandido ? "rotate-180" : "",
            )}
          />
        </button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Cerrar noticias"
          title="Cerrar noticias"
          className="shrink-0 size-7 rounded-full flex items-center justify-center text-ink-400 hover:bg-sun-100 hover:text-ink-700"
        >
          <X className="size-4" />
        </button>
      </div>

      {expandido && (
        <div className="flex flex-col gap-4 px-4 pb-4 overflow-y-auto">
          {noticias.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setNoticiaAbierta(n)}
              className="flex gap-3 text-left border-t border-sun-200 pt-4 first:border-0 first:pt-0 group"
            >
              {n.imagenUrl && (
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-sun-100">
                  <ImagenSegura
                    src={n.imagenUrl}
                    alt={n.titulo}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-display text-sm font-semibold text-ink-900 mb-1 group-hover:text-clay-600 transition-colors">
                  {n.titulo}
                </h4>
                <p className="text-xs text-ink-600 line-clamp-2">{n.contenido}</p>
                <span className="text-xs font-medium text-clay-600 mt-1 inline-block">
                  Ver noticia
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {noticiaAbierta && (
        <NoticiaDetalleModal noticia={noticiaAbierta} onClose={() => setNoticiaAbierta(null)} />
      )}
    </aside>
  );
}
