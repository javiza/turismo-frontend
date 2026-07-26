"use client";

import { Children, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Carrusel horizontal (scroll-snap nativo + flechas + puntos), sin
 * dependencias externas. Se usa para "Ofertas activas" en el home y en
 * /ofertas, tanto para visitantes como para clientes logueados.
 *
 * Antes, con pocas ofertas (1-2), las tarjetas cabían enteras en el ancho
 * del contenedor y no había nada que deslizar — se veía igual a una fila
 * normal, sin ninguna señal de que era un carrusel. Ahora:
 *  - las flechas se ven siempre (no solo en pantallas grandes),
 *  - el ancho de cada tarjeta es fijo (no % del contenedor), así casi
 *    siempre asoma un pedacito del siguiente ítem como pista visual,
 *  - hay puntos de paginación abajo que reflejan la tarjeta activa,
 *  - flechas/puntos se ocultan solos si solo hay 1 oferta (ahí no tiene
 *    sentido mostrar controles de un carrusel de un solo ítem).
 */
export function Carrusel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);
  const total = Children.count(children);

  const desplazarA = (indice: number) => {
    const el = ref.current;
    if (!el) return;
    const item = el.children[indice] as HTMLElement | undefined;
    item?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  const desplazar = (direccion: 1 | -1) => {
    desplazarA(Math.min(Math.max(activo + direccion, 0), total - 1));
  };

  // Detecta qué tarjeta quedó más a la vista para resaltar el punto activo.
  useEffect(() => {
    const el = ref.current;
    if (!el || total <= 1) return;
    const onScroll = () => {
      const nuevo = Math.round(el.scrollLeft / (el.scrollWidth / total));
      setActivo(Math.min(Math.max(nuevo, 0), total - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [total]);

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => desplazar(-1)}
            disabled={activo === 0}
            aria-label="Ver anterior"
            className="flex absolute -left-3 sm:-left-5 top-[38%] -translate-y-1/2 size-9 sm:size-10 rounded-full bg-white shadow-md border border-sun-200 items-center justify-center text-ink-700 hover:bg-sun-50 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => desplazar(1)}
            disabled={activo === total - 1}
            aria-label="Ver siguiente"
            className="flex absolute -right-3 sm:-right-5 top-[38%] -translate-y-1/2 size-9 sm:size-10 rounded-full bg-white shadow-md border border-sun-200 items-center justify-center text-ink-700 hover:bg-sun-50 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => desplazarA(i)}
                aria-label={`Ir a la tarjeta ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === activo ? "w-6 bg-clay-500" : "w-1.5 bg-sun-300"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function CarruselItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // Ancho fijo (no % del contenedor): así, aunque haya pocas ofertas,
    // el ancho total de las tarjetas + su gap normalmente supera el ancho
    // visible y siempre "asoma" la siguiente, dejando claro que se puede
    // deslizar — en vez de que quepan todas y parezca una fila estática.
    <div className={`snap-start shrink-0 w-[78%] sm:w-[340px] ${className ?? ""}`}>{children}</div>
  );
}
