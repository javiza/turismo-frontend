"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GalleryHorizontal,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  MapPin,
  CalendarRange,
  Percent,
  Newspaper,
  ImageOff,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ImagenSegura } from "@/components/shared/imagen-segura";
import type { HomeSlide, OpcionSlide, TipoSlide } from "@/types";

const QUERY_KEY = ["admin-slides"];

const TIPOS: { value: TipoSlide; label: string; icon: React.ElementType }[] = [
  { value: "destino", label: "Destino", icon: MapPin },
  { value: "paquete", label: "Paquete", icon: CalendarRange },
  { value: "oferta", label: "Oferta", icon: Percent },
  { value: "noticia", label: "Noticia", icon: Newspaper },
];

/**
 * Panel admin del slide de portada que ve el cliente logueado apenas
 * entra a su dashboard ("Inicio"). Acá el admin elige qué destinos,
 * paquetes, ofertas o noticias (ya cargados en sus respectivas
 * secciones) se destacan ahí, en qué orden y si están visibles o no —
 * ver HeroSlider en el frontend público y SlidesService en el backend.
 */
export default function AdminSlidesPage() {
  const queryClient = useQueryClient();

  const { data: slides, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<HomeSlide[]>("/slides"),
  });

  const [tipoElegido, setTipoElegido] = useState<TipoSlide>("destino");
  const [opcionElegida, setOpcionElegida] = useState<string>("");

  const { data: opciones, isLoading: cargandoOpciones } = useQuery({
    queryKey: ["admin-slides-opciones", tipoElegido],
    queryFn: () => apiFetch<OpcionSlide[]>(`/slides/opciones?tipo=${tipoElegido}`),
  });

  const agregar = useMutation({
    mutationFn: () =>
      apiFetch<HomeSlide>("/slides", {
        method: "POST",
        body: JSON.stringify({ tipo: tipoElegido, referenciaId: Number(opcionElegida) }),
      }),
    onSuccess: () => {
      toast.success("Agregado al slide de portada");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["slides-publico"] });
      setOpcionElegida("");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo agregar el slide");
    },
  });

  const actualizar = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      apiFetch<HomeSlide>(`/slides/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["slides-publico"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el slide");
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => apiFetch(`/slides/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Slide quitado de la portada");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["slides-publico"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el slide");
    },
  });

  const reordenar = useMutation({
    mutationFn: (ids: number[]) =>
      apiFetch<HomeSlide[]>("/slides/reordenar", {
        method: "PATCH",
        body: JSON.stringify({ ids }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: ["slides-publico"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo reordenar");
    },
  });

  function mover(id: number, direccion: -1 | 1) {
    if (!slides) return;
    const indice = slides.findIndex((s) => s.id === id);
    const destino = indice + direccion;
    if (indice === -1 || destino < 0 || destino >= slides.length) return;

    const nuevoOrden = [...slides];
    [nuevoOrden[indice], nuevoOrden[destino]] = [nuevoOrden[destino], nuevoOrden[indice]];
    reordenar.mutate(nuevoOrden.map((s) => s.id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <GalleryHorizontal className="size-6 text-clay-600" />
          Slide de portada
        </h1>
        <p className="text-sm text-ink-600 max-w-2xl">
          Elige qué destinos, paquetes, ofertas o noticias se destacan en el banner que ven los
          clientes apenas entran a su cuenta. La info (precio, fechas, imagen) siempre se toma en
          vivo desde la sección correspondiente — si la editas ahí, el slide se actualiza solo.
        </p>
      </div>

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold text-ink-900 mb-3">
          Agregar al slide
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <Select
            label="Tipo de servicio"
            value={tipoElegido}
            onChange={(e) => {
              setTipoElegido(e.target.value as TipoSlide);
              setOpcionElegida("");
            }}
            className="sm:w-48"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>

          <Select
            label={cargandoOpciones ? "Cargando..." : "Elegir cuál"}
            value={opcionElegida}
            onChange={(e) => setOpcionElegida(e.target.value)}
            className="flex-1"
            disabled={cargandoOpciones || !opciones || opciones.length === 0}
          >
            <option value="">Selecciona uno...</option>
            {opciones?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.titulo}
                {!o.activo ? " (inactivo)" : ""}
              </option>
            ))}
          </Select>

          <Button
            onClick={() => agregar.mutate()}
            disabled={!opcionElegida || agregar.isPending}
          >
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>
        {opciones && opciones.length === 0 && !cargandoOpciones && (
          <p className="text-xs text-ink-400 mt-2">
            Todavía no hay {TIPOS.find((t) => t.value === tipoElegido)?.label.toLowerCase()}s
            cargados en su sección.
          </p>
        )}
      </Card>

      <div>
        <h2 className="font-display text-base font-semibold text-ink-900 mb-3">
          Slides actuales {slides ? `(${slides.length})` : ""}
        </h2>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-card bg-sun-100/60 animate-pulse" />
            ))}
          </div>
        ) : !slides || slides.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-400 border-dashed">
            Todavía no hay ningún slide configurado. Agrega uno arriba.
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {slides.map((slide, i) => {
              const { icon: Icon, label } = TIPOS.find((t) => t.value === slide.tipo)!;
              return (
                <Card
                  key={slide.id}
                  className={`p-3 flex items-center gap-3 ${!slide.activo ? "opacity-60" : ""}`}
                >
                  <div className="relative size-14 rounded-lg overflow-hidden bg-sun-100 shrink-0">
                    {slide.imagen ? (
                      <ImagenSegura src={slide.imagen} alt={slide.titulo} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-ink-300">
                        <ImageOff className="size-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs text-clay-600 font-medium">
                      <Icon className="size-3.5" />
                      {label}
                      {!slide.servicioVigente && (
                        <span className="text-danger font-normal">· servicio inactivo o eliminado</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-ink-900 truncate">{slide.titulo}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => mover(slide.id, -1)}
                      disabled={i === 0 || reordenar.isPending}
                      aria-label="Subir"
                      className="size-8 rounded-lg hover:bg-sun-100 text-ink-600 disabled:opacity-30 flex items-center justify-center"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(slide.id, 1)}
                      disabled={i === slides.length - 1 || reordenar.isPending}
                      aria-label="Bajar"
                      className="size-8 rounded-lg hover:bg-sun-100 text-ink-600 disabled:opacity-30 flex items-center justify-center"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => actualizar.mutate({ id: slide.id, activo: !slide.activo })}
                      aria-label={slide.activo ? "Ocultar" : "Mostrar"}
                      title={slide.activo ? "Ocultar del slide" : "Mostrar en el slide"}
                      className="size-8 rounded-lg hover:bg-sun-100 text-ink-600 flex items-center justify-center"
                    >
                      {slide.activo ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar.mutate(slide.id)}
                      aria-label="Quitar"
                      title="Quitar del slide"
                      className="size-8 rounded-lg hover:bg-danger/10 text-danger flex items-center justify-center"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
