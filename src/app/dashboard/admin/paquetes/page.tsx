"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package, Plus, Power, Pencil, X } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  GaleriaImagenesLocal,
  GaleriaImagenesRemota,
} from "@/components/shared/galeria-imagenes";
import type { Destino, Paquete } from "@/types";

const schema = z
  .object({
    destinoId: z.coerce.number().int().positive("Elige un destino"),
    nombre: z.string().min(1, "Requerido").max(200),
    descripcion: z.string().min(1, "Requerido"),
    precio: z.coerce.number().positive("Debe ser mayor a 0"),
    cupos: z.coerce.number().int().min(0, "No puede ser negativo"),
    fechaInicio: z.string().min(1, "Requerido"),
    fechaFin: z.string().min(1, "Requerido"),
  })
  .refine((v) => v.fechaFin >= v.fechaInicio, {
    message: "La fecha de fin debe ser posterior a la de inicio",
    path: ["fechaFin"],
  });

type FormValues = z.infer<typeof schema>;

export default function AdminPaquetesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Paquete | null>(null);
  const [imagenesNuevoPaquete, setImagenesNuevoPaquete] = useState<
    { url: string; esPrincipal: boolean }[]
  >([]);

  const { data: paquetes, isLoading } = useQuery({
    queryKey: ["admin-paquetes"],
    queryFn: () => apiFetch<Paquete[]>("/paquetes/admin/todos"),
  });

  const { data: destinos } = useQuery({
    queryKey: ["admin-destinos"],
    queryFn: () => apiFetch<Destino[]>("/destinos/admin/todos"),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const destinoIdSeleccionado = watch("destinoId");
  const destinoSeleccionado = destinos?.find(
    (d) => String(d.id) === String(destinoIdSeleccionado),
  );

  const cerrarFormulario = () => {
    setShowForm(false);
    setEditando(null);
    setImagenesNuevoPaquete([]);
    reset({
      destinoId: undefined,
      nombre: "",
      descripcion: "",
      precio: undefined,
      cupos: undefined,
      fechaInicio: "",
      fechaFin: "",
    } as unknown as FormValues);
  };

  const abrirEdicion = (p: Paquete) => {
    setEditando(p);
    setShowForm(true);
    setImagenesNuevoPaquete([]);
    reset({
      destinoId: p.destinoId,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: Number(p.precio),
      cupos: p.cupos,
      fechaInicio: p.fechaInicio,
      fechaFin: p.fechaFin,
    });
  };

  const abrirCreacion = () => {
    setEditando(null);
    setShowForm(true);
    setImagenesNuevoPaquete([]);
    reset({
      destinoId: undefined,
      nombre: "",
      descripcion: "",
      precio: undefined,
      cupos: undefined,
      fechaInicio: "",
      fechaFin: "",
    } as unknown as FormValues);
  };

  const crear = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch<Paquete>("/paquetes", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          imagenes: imagenesNuevoPaquete.map((i) => i.url),
          imagenPrincipal: imagenesNuevoPaquete.find((i) => i.esPrincipal)?.url,
        }),
      }),
    onSuccess: () => {
      toast.success("Paquete creado");
      cerrarFormulario();
      queryClient.invalidateQueries({ queryKey: ["admin-paquetes"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear el paquete");
    },
  });

  const actualizar = useMutation({
    mutationFn: ({ id, values }: { id: number; values: FormValues }) =>
      apiFetch<Paquete>(`/paquetes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Paquete actualizado");
      cerrarFormulario();
      queryClient.invalidateQueries({ queryKey: ["admin-paquetes"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el paquete");
    },
  });

  const toggleActivo = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      apiFetch<Paquete>(`/paquetes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-paquetes"] }),
    onError: () => toast.error("No se pudo actualizar el paquete"),
  });

  const quitarRebaja = useMutation({
    mutationFn: (id: number) =>
      apiFetch<Paquete>(`/paquetes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ limpiarPrecioAnterior: true }),
      }),
    onSuccess: () => {
      toast.success("Se dejó de mostrar el precio anterior");
      queryClient.invalidateQueries({ queryKey: ["admin-paquetes"] });
    },
    onError: () => toast.error("No se pudo quitar la rebaja"),
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
          <h1 className="font-display text-2xl font-semibold text-ink-900">Paquetes</h1>
          <p className="text-sm text-ink-600">
            Los paquetes activos aparecen en el home, en /paquetes y para clientes con sesión
            iniciada.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => (showForm ? cerrarFormulario() : abrirCreacion())}
          disabled={!destinos?.length}
        >
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? "Cancelar" : "Nuevo paquete"}
        </Button>
      </div>

      {!destinos?.length && !isLoading && (
        <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 p-4 text-sm text-ink-600">
          Primero necesitas crear al menos un destino en la sección{" "}
          <span className="font-medium">Destinos</span> antes de poder crear un paquete.
        </div>
      )}

      {showForm && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
            {editando ? `Editando: ${editando.nombre}` : "Nuevo paquete"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Destino"
              error={errors.destinoId?.message}
              defaultValue=""
              {...register("destinoId")}
            >
              <option value="" disabled>
                Elige un destino
              </option>
              {destinos?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} ({d.ciudad}, {d.pais})
                </option>
              ))}
            </Select>
            {destinoSeleccionado && (
              <p className="text-xs text-ink-400 sm:col-span-2 -mt-2">
                Precio referencial del destino:{" "}
                {destinoSeleccionado.precioDesde != null ? (
                  <span className="font-medium text-clay-600">
                    Desde ${Number(destinoSeleccionado.precioDesde).toLocaleString("es-CL")}
                  </span>
                ) : (
                  "no tiene precio cargado"
                )}
              </p>
            )}
            <Input label="Nombre" error={errors.nombre?.message} {...register("nombre")} />
            <div>
              <Input
                label="Precio (CLP)"
                type="number"
                step="0.01"
                error={errors.precio?.message}
                {...register("precio")}
              />
              {editando?.precioAnterior && Number(editando.precioAnterior) > Number(editando.precio) && (
                <p className="text-xs text-ink-400 mt-1">
                  Mostrándose en vitrina como rebaja:{" "}
                  <span className="line-through">
                    ${Number(editando.precioAnterior).toLocaleString("es-CL")}
                  </span>{" "}
                  → ${Number(editando.precio).toLocaleString("es-CL")}. Si subes el precio de
                  nuevo, esta marca no desaparece sola: usa &quot;Quitar rebaja&quot; en la lista.
                </p>
              )}
            </div>
            <Input
              label="Cupos"
              type="number"
              error={errors.cupos?.message}
              {...register("cupos")}
            />
            <Input
              label="Fecha inicio"
              type="date"
              error={errors.fechaInicio?.message}
              {...register("fechaInicio")}
            />
            <Input
              label="Fecha fin"
              type="date"
              error={errors.fechaFin?.message}
              {...register("fechaFin")}
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Descripción"
                error={errors.descripcion?.message}
                {...register("descripcion")}
              />
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-ink-800 mb-1">Imágenes</p>
              {!editando && (
                <p className="text-xs text-ink-400 mb-2">
                  Si no agregas imágenes, el paquete hereda automáticamente la galería del
                  destino elegido.
                </p>
              )}
              {editando ? (
                <GaleriaImagenesRemota
                  entidad="paquetes"
                  entidadId={editando.id}
                  imagenes={editando.imagenes ?? []}
                  queryKeysAInvalidar={[["admin-paquetes"]]}
                />
              ) : (
                <GaleriaImagenesLocal
                  imagenes={imagenesNuevoPaquete}
                  onChange={setImagenesNuevoPaquete}
                  carpeta="paquetes"
                />
              )}
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={guardando}>
                {guardando
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Crear paquete"}
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
      ) : !paquetes || paquetes.length === 0 ? (
        <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-12 text-center text-ink-400 text-sm">
          No hay paquetes todavía.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paquetes.map((p) => (
            <Card key={p.id} className="p-4 flex items-center gap-4">
              <div className="size-9 rounded-full bg-sun-100 text-clay-600 flex items-center justify-center shrink-0">
                <Package className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink-900 truncate">{p.nombre}</p>
                <p className="text-xs text-ink-400 flex items-center gap-1.5 flex-wrap">
                  {p.precioAnterior && Number(p.precioAnterior) > Number(p.precio) ? (
                    <>
                      <span className="line-through text-ink-300">
                        ${Number(p.precioAnterior).toLocaleString("es-CL")}
                      </span>
                      <span className="font-semibold text-clay-600">
                        ${Number(p.precio).toLocaleString("es-CL")}
                      </span>
                      <span className="text-success font-medium">
                        (-
                        {Math.round(
                          (1 - Number(p.precio) / Number(p.precioAnterior)) * 100,
                        )}
                        %)
                      </span>
                    </>
                  ) : (
                    <span>${Number(p.precio).toLocaleString("es-CL")}</span>
                  )}
                  <span>· {p.cupos} cupos</span>
                </p>
              </div>
              {p.precioAnterior && Number(p.precioAnterior) > Number(p.precio) && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={quitarRebaja.isPending}
                  onClick={() => quitarRebaja.mutate(p.id)}
                  aria-label="Quitar rebaja"
                  title="Quitar el precio tachado (dejar de mostrar como rebaja)"
                >
                  Quitar rebaja
                </Button>
              )}
              <span
                className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                  p.activo ? "bg-success/15 text-success" : "bg-ink-100 text-ink-400"
                }`}
              >
                {p.activo ? "Activo" : "Inactivo"}
              </span>
              <Button size="sm" variant="ghost" onClick={() => abrirEdicion(p)} aria-label="Editar">
                <Pencil className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={toggleActivo.isPending}
                onClick={() => toggleActivo.mutate({ id: p.id, activo: !p.activo })}
                aria-label={p.activo ? "Desactivar" : "Activar"}
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
