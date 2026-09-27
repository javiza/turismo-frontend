"use client";

import { useState } from "react";
import { Newspaper, ChevronDown, X } from "lucide-react";
import { ImagenSegura } from "@/components/shared/imagen-segura";
import { NoticiaDetalleModal } from "@/components/noticias/noticia-detalle-modal";
import { cn } from "@/lib/cn";
import type { Noticia } from "@/types";

/**
 * Widget compacto de noticias para ir "a un costado" del contenido
 * principal (home público y home del cliente logueado), en vez de ser
 * su propia sección de ancho completo.
 *
 * - Desplegable: el título hace de acordeón para mostrar/ocultar la
 *   lista sin perder el widget de la página.
 * - Botón X: si el widget estorba la lectura del contenido, se puede
 *   cerrar del todo (desaparece hasta que se recargue la página).
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

  if (noticias.length === 0 || !visible) return null;

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-24 rounded-card border border-sun-200 bg-tarjeta-app p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
          className="flex flex-1 items-center gap-2 text-left text-ink-900 min-w-0"
        >
          <Newspaper className="size-5 text-clay-600 shrink-0" />
          <h3 className="font-display text-lg font-semibold truncate">{titulo}</h3>
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
        <div className="flex flex-col gap-4">
          {noticias.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setNoticiaAbierta(n)}
              className="flex gap-3 text-left border-b border-sun-200 pb-4 last:border-0 last:pb-0 group"
            >
              {n.imagenUrl && (
                <div className="relative size-14 sm:size-16 shrink-0 overflow-hidden rounded-lg bg-sun-100">
                  <ImagenSegura
                    src={n.imagenUrl}
                    alt={n.titulo}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-display text-base font-semibold text-ink-900 mb-1 group-hover:text-clay-600 transition-colors">
                  {n.titulo}
                </h4>
                <p className="text-sm text-ink-600 line-clamp-2">{n.contenido}</p>
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
