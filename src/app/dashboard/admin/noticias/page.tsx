"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Newspaper, Plus, Pencil, Trash2, X, ImageOff } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BotonSubirArchivo } from "@/components/shared/galeria-imagenes";
import type { Noticia } from "@/types";

const schema = z.object({
  titulo: z.string().min(1, "Requerido").max(200),
  contenido: z.string().min(1, "Requerido"),
  imagenUrl: z.string().max(1000).optional(),
  activa: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const QUERY_KEY = ["admin-noticias"];

export default function AdminNoticiasPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Noticia | null>(null);

  const { data: noticias, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<Noticia[]>("/noticias/admin/todas"),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { titulo: "", contenido: "", imagenUrl: "", activa: true },
  });

  function cerrarFormulario() {
    setShowForm(false);
    setEditando(null);
    reset({ titulo: "", contenido: "", imagenUrl: "", activa: true });
  }

  function abrirCreacion() {
    setEditando(null);
    setShowForm(true);
    reset({ titulo: "", contenido: "", imagenUrl: "", activa: true });
  }

  function abrirEdicion(noticia: Noticia) {
    setEditando(noticia);
    setShowForm(true);
    reset({
      titulo: noticia.titulo,
      contenido: noticia.contenido,
      imagenUrl: noticia.imagenUrl ?? "",
      activa: noticia.activa,
    });
  }

  const guardar = useMutation({
    mutationFn: (values: FormValues) =>
      editando
        ? apiFetch<Noticia>(`/noticias/${editando.id}`, {
            method: "PATCH",
            body: JSON.stringify(values),
          })
        : apiFetch<Noticia>("/noticias", {
            method: "POST",
            body: JSON.stringify(values),
          }),
    onSuccess: () => {
      toast.success(editando ? "Noticia actualizada" : "Noticia publicada");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      cerrarFormulario();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la noticia");
    },
  });

  // Borrado definitivo: sin papelera ni desactivación, se pidió explícitamente
  // que el admin pueda eliminar noticias de forma completa e irreversible.
  const eliminar = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/noticias/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Noticia eliminada de forma definitiva");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar la noticia");
    },
  });

  function handleEliminar(noticia: Noticia) {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente "${noticia.titulo}"? Esta acción no se puede deshacer.`,
    );
    if (confirmado) eliminar.mutate(noticia.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Noticias</h1>
          <p className="text-sm text-ink-600">
            Redacta, edita y elimina las noticias que se muestran a los clientes.
          </p>
        </div>
        <Button size="sm" onClick={abrirCreacion}>
          <Plus className="size-4" />
          Nueva noticia
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              {editando ? "Editar noticia" : "Nueva noticia"}
            </h2>
            <Button variant="ghost" size="sm" onClick={cerrarFormulario} aria-label="Cerrar">
              <X className="size-4" />
            </Button>
          </div>
          <form
            onSubmit={handleSubmit((v) => guardar.mutate(v))}
            className="flex flex-col gap-4"
          >
            <Input
              label="Título"
              error={errors.titulo?.message}
              {...register("titulo")}
            />
            <Textarea
              label="Contenido"
              rows={8}
              error={errors.contenido?.message}
              {...register("contenido")}
            />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink-800">Imagen (opcional)</span>
              <div className="flex flex-wrap items-center gap-3">
                <div className="size-16 rounded-card border border-dashed border-sun-300 bg-sun-50/50 flex items-center justify-center overflow-hidden shrink-0">
                  {watch("imagenUrl") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={watch("imagenUrl")}
                      alt="Imagen de la noticia"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility = "hidden";
                      }}
                    />
                  ) : (
                    <ImageOff className="size-5 text-ink-400" />
                  )}
                </div>
                <BotonSubirArchivo
                  carpeta="noticias"
                  onSubido={(url) => setValue("imagenUrl", url, { shouldDirty: true })}
                />
                <div className="flex-1 min-w-[220px]">
                  <Input
                    placeholder="O pega la URL de una imagen"
                    error={errors.imagenUrl?.message}
                    {...register("imagenUrl")}
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-800">
              <input type="checkbox" className="size-4" {...register("activa")} />
              Publicada (visible para los clientes)
            </label>

            <div>
              <Button type="submit" disabled={guardar.isPending}>
                <Newspaper className="size-4" />
                {guardar.isPending
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Publicar noticia"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="h-40 rounded-card bg-sun-100/60 animate-pulse" />
      ) : !noticias || noticias.length === 0 ? (
        <Card className="p-8 text-center text-ink-400 text-sm">
          Todavía no hay noticias. Crea la primera con el botón de arriba.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {noticias.map((noticia) => (
            <Card key={noticia.id} className="p-4 flex items-start gap-4">
              <div className="size-14 rounded-lg border border-sun-200 bg-sun-50/50 flex items-center justify-center overflow-hidden shrink-0">
                {noticia.imagenUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={noticia.imagenUrl}
                    alt={noticia.titulo}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageOff className="size-5 text-ink-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-ink-900 truncate">{noticia.titulo}</h3>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      noticia.activa
                        ? "bg-ocean-100 text-ocean-700"
                        : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {noticia.activa ? "Publicada" : "Borrador"}
                  </span>
                </div>
                <p className="text-sm text-ink-500 line-clamp-2 mt-1">{noticia.contenido}</p>
                <p className="text-xs text-ink-400 mt-1">
                  {new Date(noticia.createdAt).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => abrirEdicion(noticia)}
                  aria-label="Editar noticia"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:bg-danger/10"
                  disabled={eliminar.isPending}
                  onClick={() => handleEliminar(noticia)}
                  aria-label="Eliminar noticia definitivamente"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
