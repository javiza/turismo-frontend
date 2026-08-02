"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Trash2, Plus, ImagePlus, UploadCloud, Loader2 } from "lucide-react";
import { apiFetch, ApiError, subirImagen } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { ImagenGaleria } from "@/types";

export type Carpeta = "destinos" | "paquetes" | "ofertas" | "contenido" | "noticias";

/**
 * Botón + input[type=file] oculto para subir una imagen desde el
 * computador. Valida tipo/tamaño en el cliente (espejo de las reglas del
 * backend) antes de mandar el archivo, y delega la subida real al
 * callback `onSubido(url)` para que cada modo (local/remota) decida qué
 * hacer con la URL resultante.
 */
export function BotonSubirArchivo({
  carpeta,
  onSubido,
  disabled,
}: {
  carpeta: Carpeta;
  onSubido: (url: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!tiposPermitidos.includes(file.type)) {
      toast.error("Usa una imagen JPG, PNG, WEBP o AVIF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen supera el máximo de 5 MB");
      return;
    }

    setSubiendo(true);
    try {
      const { url } = await subirImagen(file, carpeta);
      onSubido(url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="primary"
        size="md"
        disabled={disabled || subiendo}
        onClick={() => inputRef.current?.click()}
      >
        {subiendo ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
        {subiendo ? "Subiendo..." : "Subir desde el computador"}
      </Button>
    </>
  );
}

/**
 * Galería de imágenes reusable para destinos, paquetes y ofertas: agregar
 * por URL, elegir cuál es la "de perfil" (imagen principal en cards/
 * listados) y eliminar. Dos modos:
 *
 *  - "local": la entidad todavía no existe (formulario de creación). El
 *    estado vive en el componente padre y se envía junto al resto del
 *    formulario al crear.
 *  - "remota": la entidad ya existe (formulario de edición). Cada acción
 *    pega directo a /:recurso/:id/imagenes vía la API.
 */

interface ImagenLocal {
  url: string;
  esPrincipal: boolean;
}

export function GaleriaImagenesLocal({
  imagenes,
  onChange,
  carpeta = "destinos",
}: {
  imagenes: ImagenLocal[];
  onChange: (imagenes: ImagenLocal[]) => void;
  /** Carpeta de Cloudinary donde se guardan las subidas ("destinos" | "paquetes" | "ofertas" | "contenido"). */
  carpeta?: Carpeta;
}) {
  const [nuevaUrl, setNuevaUrl] = useState("");

  const agregarUrl = (url: string) => {
    if (!url) return;
    if (imagenes.some((i) => i.url === url)) {
      toast.error("Esa imagen ya está en la galería");
      return;
    }
    onChange([...imagenes, { url, esPrincipal: imagenes.length === 0 }]);
  };

  const agregar = () => {
    const url = nuevaUrl.trim();
    agregarUrl(url);
    setNuevaUrl("");
  };

  const eliminar = (url: string) => {
    const eraPrincipal = imagenes.find((i) => i.url === url)?.esPrincipal;
    const restantes = imagenes.filter((i) => i.url !== url);
    if (eraPrincipal && restantes.length > 0) {
      restantes[0] = { ...restantes[0], esPrincipal: true };
    }
    onChange(restantes);
  };

  const marcarPrincipal = (url: string) => {
    onChange(imagenes.map((i) => ({ ...i, esPrincipal: i.url === url })));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-end">
        <BotonSubirArchivo carpeta={carpeta} onSubido={agregarUrl} />
        <div className="flex-1 min-w-[220px] flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="O pega una URL de imagen"
              placeholder="https://..."
              value={nuevaUrl}
              onChange={(e) => setNuevaUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  agregar();
                }
              }}
            />
          </div>
          <Button type="button" variant="secondary" size="md" onClick={agregar}>
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>
      </div>
      <p className="text-xs text-ink-400">
        Puedes agregar tantas fotos como necesites; marca con la estrella la que quieres usar
        como imagen de presentación (portada).
      </p>

      <GaleriaGrid
        items={imagenes.map((i) => ({ id: i.url, url: i.url, esPrincipal: i.esPrincipal }))}
        onMarcarPrincipal={(id) => marcarPrincipal(id as string)}
        onEliminar={(id) => eliminar(id as string)}
      />
    </div>
  );
}

export function GaleriaImagenesRemota({
  entidad,
  entidadId,
  imagenes,
  queryKeysAInvalidar,
}: {
  /** Segmento de ruta del recurso, ej. "destinos" | "paquetes" | "ofertas". */
  entidad: "destinos" | "paquetes" | "ofertas";
  entidadId: number;
  imagenes: ImagenGaleria[];
  /** Query keys de React Query a invalidar tras cada cambio en la galería. */
  queryKeysAInvalidar: unknown[][];
}) {
  const [nuevaUrl, setNuevaUrl] = useState("");
  const queryClient = useQueryClient();

  const invalidar = () => {
    queryKeysAInvalidar.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
  };

  const agregar = useMutation({
    mutationFn: (url: string) =>
      apiFetch(`/${entidad}/${entidadId}/imagenes`, {
        method: "POST",
        body: JSON.stringify({ url }),
      }),
    onSuccess: () => {
      setNuevaUrl("");
      invalidar();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo agregar la imagen");
    },
  });

  const eliminar = useMutation({
    mutationFn: (imagenId: number) =>
      apiFetch(`/${entidad}/${entidadId}/imagenes/${imagenId}`, { method: "DELETE" }),
    onSuccess: invalidar,
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar la imagen");
    },
  });

  const marcarPrincipal = useMutation({
    mutationFn: (imagenId: number) =>
      apiFetch(`/${entidad}/${entidadId}/imagenes/${imagenId}/principal`, { method: "PATCH" }),
    onSuccess: invalidar,
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo marcar como principal");
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-end">
        <BotonSubirArchivo
          carpeta={entidad}
          disabled={agregar.isPending}
          onSubido={(url) => agregar.mutate(url)}
        />
        <div className="flex-1 min-w-[220px] flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="O pega una URL de imagen"
              placeholder="https://..."
              value={nuevaUrl}
              onChange={(e) => setNuevaUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (nuevaUrl.trim()) agregar.mutate(nuevaUrl.trim());
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={agregar.isPending}
            onClick={() => nuevaUrl.trim() && agregar.mutate(nuevaUrl.trim())}
          >
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>
      </div>
      <p className="text-xs text-ink-400">
        Puedes agregar tantas fotos como necesites; marca con la estrella la que quieres usar
        como imagen de presentación (portada).
      </p>

      <GaleriaGrid
        items={imagenes.map((i) => ({ id: i.id, url: i.url, esPrincipal: i.esPrincipal }))}
        onMarcarPrincipal={(id) => marcarPrincipal.mutate(id as number)}
        onEliminar={(id) => eliminar.mutate(id as number)}
      />
    </div>
  );
}

function GaleriaGrid({
  items,
  onMarcarPrincipal,
  onEliminar,
}: {
  items: { id: string | number; url: string; esPrincipal: boolean }[];
  onMarcarPrincipal: (id: string | number) => void;
  onEliminar: (id: string | number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-8 text-center text-ink-400 text-sm flex flex-col items-center gap-2">
        <ImagePlus className="size-6" />
        Todavía no hay imágenes. Agrega al menos una.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        // eslint-disable-next-line @next/next/no-img-element
        <div
          key={item.id}
          className={cn(
            "relative rounded-card overflow-hidden border-2 group",
            item.esPrincipal ? "border-clay-500" : "border-transparent",
          )}
        >
          <img
            src={item.url}
            alt=""
            className="h-28 w-full object-cover bg-sun-100"
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = "0.3";
            }}
          />
          {item.esPrincipal && (
            <span className="absolute top-1.5 left-1.5 bg-clay-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="size-3 fill-white" />
              Perfil
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 p-1.5 bg-gradient-to-t from-ink-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            {!item.esPrincipal && (
              <button
                type="button"
                onClick={() => onMarcarPrincipal(item.id)}
                aria-label="Marcar como imagen de perfil"
                title="Marcar como imagen de perfil"
                className="size-7 rounded-full bg-white/90 text-clay-600 flex items-center justify-center hover:bg-white"
              >
                <Star className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onEliminar(item.id)}
              aria-label="Eliminar imagen"
              title="Eliminar imagen"
              className="size-7 rounded-full bg-white/90 text-danger flex items-center justify-center hover:bg-white"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
