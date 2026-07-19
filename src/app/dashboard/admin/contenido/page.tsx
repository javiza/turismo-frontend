"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContenidoHome } from "@/types";

const resenaSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(150),
  texto: z.string().min(1, "Requerido").max(1000),
  valoracion: z.coerce.number().int().min(1).max(5).optional(),
});

const schema = z.object({
  nombreAgencia: z.string().max(150),
  titulo: z.string().max(300),
  subtitulo: z.string().max(500),
  presentacion: z.string().max(4000),
  mision: z.string().max(4000),
  vision: z.string().max(4000),
  valores: z.string().max(4000),
  resenas: z.array(resenaSchema).max(50),
});

type FormValues = z.infer<typeof schema>;

export default function AdminContenidoPage() {
  const queryClient = useQueryClient();

  const { data: contenido, isLoading } = useQuery({
    queryKey: ["admin-contenido-home"],
    queryFn: () => apiFetch<ContenidoHome>("/contenido-home"),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombreAgencia: "",
      titulo: "",
      subtitulo: "",
      presentacion: "",
      mision: "",
      vision: "",
      valores: "",
      resenas: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "resenas" });

  // Precarga el formulario en cuanto llega el contenido guardado.
  useEffect(() => {
    if (contenido) {
      reset({
        nombreAgencia: contenido.nombreAgencia,
        titulo: contenido.titulo,
        subtitulo: contenido.subtitulo,
        presentacion: contenido.presentacion,
        mision: contenido.mision,
        vision: contenido.vision,
        valores: contenido.valores,
        resenas: contenido.resenas,
      });
    }
  }, [contenido, reset]);

  const guardar = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch<ContenidoHome>("/contenido-home", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      toast.success("Contenido de la home actualizado");
      queryClient.setQueryData(["admin-contenido-home"], data);
      reset({
        nombreAgencia: data.nombreAgencia,
        titulo: data.titulo,
        subtitulo: data.subtitulo,
        presentacion: data.presentacion,
        mision: data.mision,
        vision: data.vision,
        valores: data.valores,
        resenas: data.resenas,
      });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el contenido");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Contenido de la home
        </h1>
        <p className="text-sm text-ink-600">
          Este texto y las reseñas aparecen en la página de inicio pública. Úsalo para
          transmitir seriedad: título, presentación de la agencia y opiniones de clientes.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-card bg-sun-100/60 animate-pulse" />
      ) : (
        <form onSubmit={handleSubmit((v) => guardar.mutate(v))} className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
              Portada (hero)
            </h2>
            <div className="grid gap-4">
              <Input
                label="Nombre de la agencia"
                placeholder="Tu Agencia de Viajes"
                error={errors.nombreAgencia?.message}
                {...register("nombreAgencia")}
              />
              <Input
                label="Título principal"
                placeholder="Programa tus vacaciones con nosotros"
                error={errors.titulo?.message}
                {...register("titulo")}
              />
              <Textarea
                label="Subtítulo (bajada)"
                placeholder="Arma tu próximo viaje con destinos, paquetes y ofertas curadas por nuestro equipo — todo reservable en minutos."
                rows={2}
                error={errors.subtitulo?.message}
                {...register("subtitulo")}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
              Quiénes somos
            </h2>
            <div className="grid gap-4">
              <Textarea
                label="Presentación"
                rows={4}
                error={errors.presentacion?.message}
                {...register("presentacion")}
              />
              <Textarea
                label="Misión"
                rows={3}
                error={errors.mision?.message}
                {...register("mision")}
              />
              <Textarea
                label="Visión"
                rows={3}
                error={errors.vision?.message}
                {...register("vision")}
              />
              <Textarea
                label="Valores"
                rows={3}
                error={errors.valores?.message}
                {...register("valores")}
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  Reseñas de clientes
                </h2>
                <p className="text-sm text-ink-600">
                  Aparecen en la sección &quot;Lo que dicen nuestros clientes&quot; de la home.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => append({ nombre: "", texto: "", valoracion: 5 })}
              >
                <Plus className="size-4" />
                Agregar reseña
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-8 text-center text-ink-400 text-sm">
                No hay reseñas todavía.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-start rounded-card border border-ink-100 p-4"
                  >
                    <Input
                      label="Nombre del cliente"
                      error={errors.resenas?.[index]?.nombre?.message}
                      {...register(`resenas.${index}.nombre`)}
                    />
                    <Input
                      label="Reseña"
                      error={errors.resenas?.[index]?.texto?.message}
                      {...register(`resenas.${index}.texto`)}
                    />
                    <Input
                      label="Estrellas (1-5)"
                      type="number"
                      min={1}
                      max={5}
                      className="w-28"
                      error={errors.resenas?.[index]?.valoracion?.message}
                      {...register(`resenas.${index}.valoracion`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-6"
                      onClick={() => remove(index)}
                      aria-label="Eliminar reseña"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={guardar.isPending || !isDirty}>
              <FileText className="size-4" />
              {guardar.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
