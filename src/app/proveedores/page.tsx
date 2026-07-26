"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CheckCircle2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Proveedor } from "@/types";

const schema = z.object({
  nombreNegocio: z.string().min(1, "Requerido").max(150),
  rubro: z.string().max(150).optional().or(z.literal("")),
  nombreContacto: z.string().min(1, "Requerido").max(150),
  correo: z.string().email("Correo inválido").max(150),
  telefono: z.string().min(1, "Requerido").max(50),
  direccion: z.string().max(200).optional().or(z.literal("")),
  descripcion: z.string().min(1, "Cuéntanos brevemente sobre tu negocio").max(2000),
});
type FormValues = z.infer<typeof schema>;

export default function ProveedoresPage() {
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const enviar = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch<Proveedor>("/proveedores", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => setEnviado(true),
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo enviar el formulario");
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      <div className="flex items-center gap-2 text-clay-600 mb-3">
        <Building2 className="size-5" />
        <span className="text-sm font-medium">Contacto proveedores</span>
      </div>
      <h1 className="font-display text-3xl font-semibold text-ink-900 mb-2">
        ¿Tienes un negocio turístico?
      </h1>
      <p className="text-ink-600 mb-8">
        Si ofreces hospedaje, transporte, actividades u otro servicio turístico y quieres
        trabajar con nosotros, déjanos tus datos. Nuestro equipo revisará tu información y se
        pondrá en contacto contigo.
      </p>

      {enviado ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="size-10 text-success mx-auto mb-3" />
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-1">
            ¡Gracias por tu interés!
          </h2>
          <p className="text-sm text-ink-600">
            Recibimos tus datos. Nuestro equipo los revisará y te contactará a la brevedad.
          </p>
        </Card>
      ) : (
        <Card className="p-6">
          <form
            onSubmit={handleSubmit((v) => enviar.mutate(v))}
            className="grid sm:grid-cols-2 gap-4"
          >
            <Input
              label="Nombre del negocio"
              error={errors.nombreNegocio?.message}
              {...register("nombreNegocio")}
            />
            <Input
              label="Rubro (opcional)"
              placeholder="Ej: transporte, hospedaje, tours..."
              error={errors.rubro?.message}
              {...register("rubro")}
            />
            <Input
              label="Nombre de contacto"
              error={errors.nombreContacto?.message}
              {...register("nombreContacto")}
            />
            <Input
              label="Teléfono"
              error={errors.telefono?.message}
              {...register("telefono")}
            />
            <Input
              label="Correo"
              type="email"
              error={errors.correo?.message}
              {...register("correo")}
            />
            <Input
              label="Dirección (opcional)"
              error={errors.direccion?.message}
              {...register("direccion")}
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Cuéntanos sobre tu negocio"
                placeholder="Qué ofreces, zona donde operas, experiencia, disponibilidad..."
                error={errors.descripcion?.message}
                {...register("descripcion")}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={enviar.isPending}>
                {enviar.isPending ? "Enviando..." : "Enviar datos"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
