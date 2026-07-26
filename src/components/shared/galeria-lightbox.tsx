"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import type { ImagenGaleria } from "@/types";

/**
 * Envuelve la portada de un destino/paquete/oferta (lo que se le pase
 * como `children`) y la vuelve clickeable: al hacer click se abre un
 * lightbox a pantalla completa con TODAS las fotos de la galería, tipo
 * carrusel (flechas, puntos, teclado). Si la entidad tiene una sola foto
 * (o ninguna), el click no hace nada especial — simplemente no se
 * muestra el contador de fotos.
 */
export function GaleriaLightbox({
  imagenes,
  imagenPrincipal,
  nombre,
  children,
  className,
}: {
  imagenes?: ImagenGaleria[];
  imagenPrincipal?: string;
  nombre: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [abierta, setAbierta] = useState(false);
  const [indice, setIndice] = useState(0);

  const urls =
    imagenes && imagenes.length > 0
      ? imagenes.map((i) => i.url)
      : imagenPrincipal
        ? [imagenPrincipal]
        : [];

  const siguiente = () => setIndice((i) => (i + 1) % urls.length);
  const anterior = () => setIndice((i) => (i - 1 + urls.length) % urls.length);

  useEffect(() => {
    if (!abierta) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(false);
      if (e.key === "ArrowRight") siguiente();
      if (e.key === "ArrowLeft") anterior();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, urls.length]);

  if (urls.length === 0) {
    return <>{children}</>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIndice(0);
          setAbierta(true);
        }}
        className={`relative block w-full text-left cursor-zoom-in ${className ?? ""}`}
        aria-label={`Ver fotos de ${nombre}`}
      >
        {children}
        {urls.length > 1 && (
          <span className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-ink-900/70 text-white text-[11px] font-medium px-2 py-1 rounded-full">
            <Images className="size-3" />
            {urls.length} fotos
          </span>
        )}
      </button>

      {abierta && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setAbierta(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de ${nombre}`}
        >
          <button
            type="button"
            onClick={() => setAbierta(false)}
            className="absolute top-4 right-4 size-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="Cerrar galería"
          >
            <X className="size-5" />
          </button>

          <p className="absolute top-5 left-5 text-white/80 text-sm font-medium">{nombre}</p>

          <div
            className="relative w-full max-w-3xl aspect-[4/3]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={urls[indice]}
              alt={`${nombre} — foto ${indice + 1} de ${urls.length}`}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain"
              priority
            />

            {urls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={anterior}
                  aria-label="Foto anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 text-ink-900 flex items-center justify-center hover:bg-white"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={siguiente}
                  aria-label="Foto siguiente"
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 text-ink-900 flex items-center justify-center hover:bg-white"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>

          {urls.length > 1 && (
            <div
              className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {urls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndice(i)}
                  aria-label={`Ir a la foto ${i + 1}`}
                  className={`size-2 rounded-full transition-colors ${
                    i === indice ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
