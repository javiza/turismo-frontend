"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tag, Plus, Power, Pencil, X } from "lucide-react";
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
import type { Paquete, Oferta } from "@/types";

const schema = z
  .object({
    paqueteId: z.coerce.number().int().positive("Elige un paquete"),
    titulo: z.string().min(1, "Requerido").max(200),
    descripcion: z.string().optional(),
    descuento: z.coerce.number().min(0.01, "Mínimo 0.01").max(100, "Máximo 100"),
    fechaInicio: z.string().min(1, "Requerido"),
    fechaFin: z.string().min(1, "Requerido"),
  })
  .refine((v) => v.fechaFin >= v.fechaInicio, {
    message: "La fecha de fin debe ser posterior a la de inicio",
    path: ["fechaFin"],
  });

type FormValues = z.infer<typeof schema>;

export default function AdminOfertasPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Oferta | null>(null);
  const [imagenesNuevaOferta, setImagenesNuevaOferta] = useState<
    { url: string; esPrincipal: boolean }[]
  >([]);

  const { data: ofertas, isLoading } = useQuery({
    queryKey: ["admin-ofertas"],
    queryFn: () => apiFetch<Oferta[]>("/ofertas/admin/todas"),
  });

  const { data: paquetes } = useQuery({
    queryKey: ["admin-paquetes"],
    queryFn: () => apiFetch<Paquete[]>("/paquetes/admin/todos"),
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
    setImagenesNuevaOferta([]);
    reset({
      paqueteId: undefined,
      titulo: "",
      descripcion: "",
      descuento: undefined,
      fechaInicio: "",
      fechaFin: "",
    } as unknown as FormValues);
  };

  const abrirCreacion = () => {
    setEditando(null);
    setShowForm(true);
    setImagenesNuevaOferta([]);
    reset({
      paqueteId: undefined,
      titulo: "",
      descripcion: "",
      descuento: undefined,
      fechaInicio: "",
      fechaFin: "",
    } as unknown as FormValues);
  };

  const abrirEdicion = (o: Oferta) => {
    setEditando(o);
    setShowForm(true);
    setImagenesNuevaOferta([]);
    reset({
      paqueteId: o.paqueteId,
      titulo: o.titulo,
      descripcion: o.descripcion ?? "",
      descuento: Number(o.descuento),
      fechaInicio: o.fechaInicio,
      fechaFin: o.fechaFin,
    });
  };

  const crear = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch<Oferta>("/ofertas", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          descripcion: values.descripcion || undefined,
          imagenes: imagenesNuevaOferta.map((i) => i.url),
          imagenPrincipal: imagenesNuevaOferta.find((i) => i.esPrincipal)?.url,
        }),
      }),
    onSuccess: () => {
      toast.success("Oferta creada");
      cerrarFormulario();
      queryClient.invalidateQueries({ queryKey: ["admin-ofertas"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear la oferta");
    },
  });

  const actualizar = useMutation({
    mutationFn: ({ id, values }: { id: number; values: FormValues }) =>
      apiFetch<Oferta>(`/ofertas/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...values, descripcion: values.descripcion || undefined }),
      }),
    onSuccess: () => {
      toast.success("Oferta actualizada");
      cerrarFormulario();
      queryClient.invalidateQueries({ queryKey: ["admin-ofertas"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar la oferta");
    },
  });

  const toggleActiva = useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) =>
      apiFetch<Oferta>(`/ofertas/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ activa }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-ofertas"] }),
    onError: () => toast.error("No se pudo actualizar la oferta"),
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
          <h1 className="font-display text-2xl font-semibold text-ink-900">Ofertas</h1>
          <p className="text-sm text-ink-600">
            Descuentos sobre un paquete. Se aplican automáticamente al calcular el monto de una
            reserva mientras estén vigentes.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => (showForm ? cerrarFormulario() : abrirCreacion())}
          disabled={!paquetes?.length}
        >
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? "Cancelar" : "Nueva oferta"}
        </Button>
      </div>

      {!paquetes?.length && !isLoading && (
        <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 p-4 text-sm text-ink-600">
          Primero necesitas crear al menos un paquete en la sección{" "}
          <span className="font-medium">Paquetes</span> antes de poder crear una oferta.
        </div>
      )}

      {showForm && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
            {editando ? `Editando: ${editando.titulo}` : "Nueva oferta"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Paquete"
              error={errors.paqueteId?.message}
              defaultValue=""
              {...register("paqueteId")}
            >
              <option value="" disabled>
                Elige un paquete
              </option>
              {paquetes?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
            <Input label="Título" error={errors.titulo?.message} {...register("titulo")} />
            <Input
              label="Descuento (%)"
              type="number"
              step="0.01"
              min={0.01}
              max={100}
              error={errors.descuento?.message}
              {...register("descuento")}
            />
            <div />
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
                label="Descripción (opcional)"
                error={errors.descripcion?.message}
                {...register("descripcion")}
              />
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-ink-800 mb-1">Imágenes</p>
              {!editando && (
                <p className="text-xs text-ink-400 mb-2">
                  Si no agregas imágenes, la oferta hereda automáticamente la galería del
                  paquete elegido (o la de su destino, si el paquete tampoco tiene).
                </p>
              )}
              {editando ? (
                <GaleriaImagenesRemota
                  entidad="ofertas"
                  entidadId={editando.id}
                  imagenes={editando.imagenes ?? []}
                  queryKeysAInvalidar={[["admin-ofertas"]]}
                />
              ) : (
                <GaleriaImagenesLocal
                  imagenes={imagenesNuevaOferta}
                  onChange={setImagenesNuevaOferta}
                />
              )}
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear oferta"}
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
      ) : !ofertas || ofertas.length === 0 ? (
        <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-12 text-center text-ink-400 text-sm">
          No hay ofertas todavía.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ofertas.map((o) => (
            <Card key={o.id} className="p-4 flex items-center gap-4">
              <div className="size-9 rounded-full bg-sun-100 text-clay-600 flex items-center justify-center shrink-0">
                <Tag className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink-900 truncate">{o.titulo}</p>
                <p className="text-xs text-ink-400">{Number(o.descuento)}% de descuento</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                  o.activa ? "bg-success/15 text-success" : "bg-ink-100 text-ink-400"
                }`}
              >
                {o.activa ? "Activa" : "Inactiva"}
              </span>
              <Button size="sm" variant="ghost" onClick={() => abrirEdicion(o)} aria-label="Editar">
                <Pencil className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={toggleActiva.isPending}
                onClick={() => toggleActiva.mutate({ id: o.id, activa: !o.activa })}
                aria-label={o.activa ? "Desactivar" : "Activar"}
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
