"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CheckCircle2, ImageOff, Loader2, UploadCloud } from "lucide-react";
import { apiFetch, ApiError, subirImagenProveedor } from "@/lib/api-client";
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
  imagenUrl: z.string().max(1000).optional().or(z.literal("")),
  precioReferencial: z
    .union([z.string().length(0), z.coerce.number().min(0, "Debe ser 0 o mayor")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : Number(v))),
});
type FormValues = z.infer<typeof schema>;

export default function ProveedoresPage() {
  const [enviado, setEnviado] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const imagenUrl = watch("imagenUrl");

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

  async function handleArchivo(archivo: File | undefined) {
    if (!archivo) return;
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!tiposPermitidos.includes(archivo.type)) {
      toast.error("Usa una imagen JPG, PNG, WEBP o AVIF");
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      toast.error("La imagen supera el máximo de 5 MB");
      return;
    }

    setSubiendoImagen(true);
    try {
      const { url } = await subirImagenProveedor(archivo);
      setValue("imagenUrl", url, { shouldDirty: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo subir la imagen");
    } finally {
      setSubiendoImagen(false);
      if (inputArchivoRef.current) inputArchivoRef.current.value = "";
    }
  }

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

            <div className="sm:col-span-2 flex flex-col gap-2">
              <span className="text-sm font-medium text-ink-800">Imagen del negocio (opcional)</span>
              <p className="text-xs text-ink-400 -mt-1">
                Una foto de tu local, tus servicios o tu equipo ayuda a que nos hagamos una idea
                más rápido.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="size-16 rounded-card border border-dashed border-sun-300 bg-sun-50/50 flex items-center justify-center overflow-hidden shrink-0">
                  {imagenUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagenUrl}
                      alt="Imagen del negocio"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility = "hidden";
                      }}
                    />
                  ) : (
                    <ImageOff className="size-5 text-ink-400" />
                  )}
                </div>
                <input
                  ref={inputArchivoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => handleArchivo(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  disabled={subiendoImagen}
                  onClick={() => inputArchivoRef.current?.click()}
                >
                  {subiendoImagen ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UploadCloud className="size-4" />
                  )}
                  {subiendoImagen ? "Subiendo..." : "Subir imagen"}
                </Button>
              </div>
            </div>

            <Input
              label="Precio referencial (opcional)"
              type="number"
              min={0}
              step="0.01"
              placeholder="Ej: 25000"
              error={errors.precioReferencial?.message}
              {...register("precioReferencial")}
            />

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
