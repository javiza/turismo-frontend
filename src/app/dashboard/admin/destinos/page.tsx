"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPinned, Plus, Power, Pencil, X } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  GaleriaImagenesLocal,
  GaleriaImagenesRemota,
} from "@/components/shared/galeria-imagenes";
import type { Destino } from "@/types";

const schema = z.object({
  nombre: z.string().min(1, "Requerido").max(200),
  descripcion: z.string().min(1, "Requerido"),
  pais: z.string().min(1, "Requerido").max(100),
  ciudad: z.string().min(1, "Requerido").max(100),
});

type FormValues = z.infer<typeof schema>;

export default function AdminDestinosPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Destino | null>(null);
  const [imagenesNuevoDestino, setImagenesNuevoDestino] = useState<
    { url: string; esPrincipal: boolean }[]
  >([]);

  const { data: destinos, isLoading } = useQuery({
    queryKey: ["admin-destinos"],
    queryFn: () => apiFetch<Destino[]>("/destinos/admin/todos"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const cerrarFormulario = () => {
    setShowForm(false);
    setEditando(null);
    setImagenesNuevoDestino([]);
    reset({ nombre: "", descripcion: "", pais: "", ciudad: "" });
  };

  const abrirCreacion = () => {
    setEditando(null);
    setShowForm(true);
    setImagenesNuevoDestino([]);
    reset({ nombre: "", descripcion: "", pais: "", ciudad: "" });
  };

  const abrirEdicion = (d: Destino) => {
    setEditando(d);
    setShowForm(true);
    setImagenesNuevoDestino([]);
    reset({
      nombre: d.nombre,
      descripcion: d.descripcion,
      pais: d.pais,
      ciudad: d.ciudad,
    });
  };

  const crear = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch<Destino>("/destinos", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          imagenes: imagenesNuevoDestino.map((i) => i.url),
          imagenPrincipal: imagenesNuevoDestino.find((i) => i.esPrincipal)?.url,
        }),
      }),
    onSuccess: () => {
      toast.success("Destino creado");
      cerrarFormulario();
      queryClient.invalidateQueries({ queryKey: ["admin-destinos"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear el destino");
    },
  });

  const actualizar = useMutation({
    mutationFn: ({ id, values }: { id: number; values: FormValues }) =>
      apiFetch<Destino>(`/destinos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Destino actualizado");
      cerrarFormulario();
      queryClient.invalidateQueries({ queryKey: ["admin-destinos"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el destino");
    },
  });

  const toggleActivo = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      apiFetch<Destino>(`/destinos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-destinos"] });
    },
    onError: () => toast.error("No se pudo actualizar el destino"),
  });

  const onSubmit = (values: FormValues) => {
    if (editando) {
      actualizar.mutate({ id: editando.id, values });
    } else {
      crear.mutate(values);
    }
  };

  const guardando = crear.isPending || actualizar.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Destinos</h1>
          <p className="text-sm text-ink-600">
            Solo destinos activos se muestran en el home y en /destinos.
          </p>
        </div>
        <Button size="sm" onClick={() => (showForm ? cerrarFormulario() : abrirCreacion())}>
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? "Cancelar" : "Nuevo destino"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
            {editando ? `Editando: ${editando.nombre}` : "Nuevo destino"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid sm:grid-cols-2 gap-4">
            <Input label="Nombre" error={errors.nombre?.message} {...register("nombre")} />
            <Input label="País" error={errors.pais?.message} {...register("pais")} />
            <Input label="Ciudad" error={errors.ciudad?.message} {...register("ciudad")} />
            <div className="sm:col-span-2">
              <Textarea
                label="Descripción"
                error={errors.descripcion?.message}
                {...register("descripcion")}
              />
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-ink-800 mb-2">Imágenes</p>
              {editando ? (
                <GaleriaImagenesRemota
                  entidad="destinos"
                  entidadId={editando.id}
                  imagenes={editando.imagenes ?? []}
                  queryKeysAInvalidar={[["admin-destinos"]]}
                />
              ) : (
                <GaleriaImagenesLocal
                  imagenes={imagenesNuevoDestino}
                  onChange={setImagenesNuevoDestino}
                  carpeta="destinos"
                />
              )}
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear destino"}
              </Button>
              <Button type="button" variant="ghost" onClick={cerrarFormulario}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-card bg-sun-100/60 animate-pulse" />
          ))}
        </div>
      ) : !destinos || destinos.length === 0 ? (
        <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-12 text-center text-ink-400 text-sm">
          No hay destinos todavía.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {destinos.map((d) => (
            <Card key={d.id} className="p-4 flex items-center gap-4">
              <div className="size-9 rounded-full bg-sun-100 text-clay-600 flex items-center justify-center shrink-0">
                <MapPinned className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink-900 truncate">{d.nombre}</p>
                <p className="text-xs text-ink-400">
                  {d.ciudad}, {d.pais}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                  d.activo ? "bg-success/15 text-success" : "bg-ink-100 text-ink-400"
                }`}
              >
                {d.activo ? "Activo" : "Inactivo"}
              </span>
              <Button size="sm" variant="ghost" onClick={() => abrirEdicion(d)} aria-label="Editar">
                <Pencil className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={toggleActivo.isPending}
                onClick={() => toggleActivo.mutate({ id: d.id, activo: !d.activo })}
                aria-label={d.activo ? "Desactivar" : "Activar"}
              >
                <Power className="size-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
