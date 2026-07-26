"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Wrapper de next/image: si la URL no es una imagen válida (ej. alguien
 * pegó un link de "compartir" de Google Fotos/Drive en vez de una URL de
 * imagen directa), next/image tira "isn't a valid image" en el server y
 * el usuario ve un ícono roto. Acá, en vez de eso, mostramos un
 * placeholder discreto — sin romper el layout ni ensuciar los logs cada
 * vez que se recarga la página.
 *
 * Drop-in replacement de <Image fill .../> (mismo uso con `fill`, que es
 * como se usa en todo el sitio para las miniaturas de destinos/paquetes/
 * ofertas).
 */
export function ImagenSegura({ alt, className, ...props }: ImageProps) {
  const [fallo, setFallo] = useState(false);

  if (fallo) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-sun-100 text-ink-400",
          props.fill ? "absolute inset-0" : "",
          className,
        )}
      >
        <ImageOff className="size-6" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image alt={alt} className={className} onError={() => setFallo(true)} {...props} />
  );
}
