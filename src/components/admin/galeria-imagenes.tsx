"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Star, ImageIcon } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImagenGaleria } from "@/types";

function Miniatura({
  url,
  esPrincipal,
  onMarcarPrincipal,
  onEliminar,
  eliminando,
}: {
  url: string;
  esPrincipal: boolean;
  onMarcarPrincipal: () => void;
  onEliminar: () => void;
  eliminando?: boolean;
}) {
  return (
    <div
      className={`relative rounded-card overflow-hidden border-2 group ${
        esPrincipal ? "border-clay-500" : "border-transparent"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-24 w-full object-cover bg-sun-100" />
      <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={onMarcarPrincipal}
          title="Marcar como imagen de perfil"
          className="size-7 rounded-full bg-white/90 flex items-center justify-center text-clay-600 hover:bg-white"
        >
          <Star className={`size-4 ${esPrincipal ? "fill-clay-500" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onEliminar}
          disabled={eliminando}
          title="Eliminar imagen"
          className="size-7 rounded-full bg-white/90 flex items-center justify-center text-danger hover:bg-white"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {esPrincipal && (
        <span className="absolute top-1.5 left-1.5 text-[10px] font-medium bg-clay-500 text-white px-1.5 py-0.5 rounded-full">
          Perfil
        </span>
      )}
    </div>
  );
}

/**
 * Modo "local": para el formulario de creación, cuando todavía no existe
 * el destino/paquete/oferta en el backend. Las imágenes viven en el
 * estado del formulario y se mandan junto con el resto de los datos al
 * crear (campos `imagenes` + `imagenPrincipal` del DTO de creación).
 */
export function GaleriaImagenesLocal({
  urls,
  principal,
  onChange,
}: {
  urls: string[];
  principal: string | null;
  onChange: (urls: string[], principal: string | null) => void;
}) {
  const [nuevaUrl, setNuevaUrl] = useState("");

  const agregar = () => {
    const url = nuevaUrl.trim();
    if (!url) return;
    if (urls.includes(url)) {
      toast.error("Esa imagen ya está en la galería");
      return;
    }
    const nuevas = [...urls, url];
    onChange(nuevas, principal ?? url);
    setNuevaUrl("");
  };

  const eliminar = (url: string) => {
    const nuevas = urls.filter((u) => u !== url);
    const nuevaPrincipal = principal === url ? (nuevas[0] ?? null) : principal;
    onChange(nuevas, nuevaPrincipal);
  };

  const marcarPrincipal = (url: string) => onChange(urls, url);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-ink-800">
        Imágenes (puedes agregar más de una; la marcada con la estrella es la de perfil)
      </span>
      <div className="flex gap-2">
        <Input
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
        <Button type="button" variant="secondary" onClick={agregar}>
          <Plus className="size-4" />
          Agregar
        </Button>
      </div>

      {urls.length === 0 ? (
        <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-6 text-center text-ink-400 text-sm flex flex-col items-center gap-1">
          <ImageIcon className="size-5" />
          Sin imágenes todavía.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {urls.map((url) => (
            <Miniatura
              key={url}
              url={url}
              esPrincipal={url === principal}
              onMarcarPrincipal={() => marcarPrincipal(url)}
              onEliminar={() => eliminar(url)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Modo "remoto": para el formulario de edición, cuando la entidad ya
 * existe. Cada acción pega directo contra /{basePath}/:id/imagenes.
 */
export function GaleriaImagenesRemota({
  basePath,
  entityId,
  imagenes,
  queryKeyInvalidar,
}: {
  basePath: string;
  entityId: number;
  imagenes: ImagenGaleria[];
  queryKeyInvalidar: string[];
}) {
  const [nuevaUrl, setNuevaUrl] = useState("");
  const queryClient = useQueryClient();

  const invalidar = () => queryClient.invalidateQueries({ queryKey: queryKeyInvalidar });

  const agregar = useMutation({
    mutationFn: (url: string) =>
      apiFetch(`${basePath}/${entityId}/imagenes`, {
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
      apiFetch(`${basePath}/${entityId}/imagenes/${imagenId}`, { method: "DELETE" }),
    onSuccess: invalidar,
    onError: () => toast.error("No se pudo eliminar la imagen"),
  });

  const marcarPrincipal = useMutation({
    mutationFn: (imagenId: number) =>
      apiFetch(`${basePath}/${entityId}/imagenes/${imagenId}/principal`, { method: "PATCH" }),
    onSuccess: invalidar,
    onError: () => toast.error("No se pudo marcar la imagen como principal"),
  });

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-ink-800">
        Imágenes (puedes agregar más de una; la marcada con la estrella es la de perfil)
      </span>
      <div className="flex gap-2">
        <Input
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
        <Button
          type="button"
          variant="secondary"
          disabled={agregar.isPending}
          onClick={() => nuevaUrl.trim() && agregar.mutate(nuevaUrl.trim())}
        >
          <Plus className="size-4" />
          Agregar
        </Button>
      </div>

      {imagenes.length === 0 ? (
        <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-6 text-center text-ink-400 text-sm flex flex-col items-center gap-1">
          <ImageIcon className="size-5" />
          Sin imágenes todavía.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {imagenes.map((img) => (
            <Miniatura
              key={img.id}
              url={img.url}
              esPrincipal={img.esPrincipal}
              onMarcarPrincipal={() => marcarPrincipal.mutate(img.id)}
              onEliminar={() => eliminar.mutate(img.id)}
              eliminando={eliminar.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
