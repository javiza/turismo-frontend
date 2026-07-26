"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Plus, Trash2, ImageOff, X, UploadCloud, Loader2 } from "lucide-react";
import { apiFetch, ApiError, subirFuente } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BotonSubirArchivo } from "@/components/shared/galeria-imagenes";
import { FUENTES_SLOGAN, resolverFontFamilySlogan } from "@/lib/slogan-fonts";
import type { ContenidoHome } from "@/types";

// Cada sección de este panel se guarda por separado (su propio form +
// mutation + botón "Guardar"), en vez de un único formulario gigante:
// un admin que solo quiere cambiar el teléfono no debería tener que
// revisar (ni arriesgarse a tocar sin querer) el resto del contenido.
// El backend ya soporta esto: PATCH /contenido-home actualiza solo las
// claves que llegan en el body (ver ContenidoService.actualizar).

const QUERY_KEY = ["admin-contenido-home"];

// El navbar/footer/home públicos cachean contenido-home por 60s (ISR).
// Llamamos a este endpoint apenas se guarda cualquier sección para que
// el cambio se vea al instante en vez de esperar esa ventana — ver
// /api/revalidate/contenido-home/route.ts. Si falla (ej. red lenta) no
// rompemos el flujo de guardado: en el peor caso el cambio tarda hasta
// 60s en reflejarse públicamente, como antes.
function revalidarContenidoPublico() {
  fetch("/api/revalidate/contenido-home", { method: "POST" }).catch(() => {});
}

export default function AdminContenidoPage() {
  const { data: contenido, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<ContenidoHome>("/contenido-home"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Contenido de la home
        </h1>
        <p className="text-sm text-ink-600">
          Este texto y las reseñas aparecen en la página de inicio pública. Cada sección se
          guarda de forma independiente.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-card bg-sun-100/60 animate-pulse" />
      ) : (
        <div className="flex flex-col gap-6">
          <SeccionPortada contenido={contenido} />
          <SeccionQuienesSomos contenido={contenido} />
          <SeccionContacto contenido={contenido} />
          <SeccionResenas contenido={contenido} />
        </div>
      )}
    </div>
  );
}

// --- Portada (hero): logo, nombre/slogan, color del slogan, título, subtítulo ---

const FUENTES_SLOGAN_KEYS = FUENTES_SLOGAN.map((f) => f.key) as [string, ...string[]];

const schemaPortada = z.object({
  nombreAgencia: z.string().max(150),
  logoUrl: z.string().max(1000),
  sloganColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Debe ser un color hexadecimal, ej: #c2410c"),
  sloganFontFamily: z.enum(FUENTES_SLOGAN_KEYS),
  sloganFontUrl: z.string().max(1000),
  titulo: z.string().max(300),
  subtitulo: z.string().max(500),
});

type FormPortada = z.infer<typeof schemaPortada>;

function SeccionPortada({ contenido }: { contenido?: ContenidoHome }) {
  const queryClient = useQueryClient();
  const inputFuenteRef = useRef<HTMLInputElement>(null);
  const [subiendoFuente, setSubiendoFuente] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormPortada>({
    resolver: zodResolver(schemaPortada),
    defaultValues: {
      nombreAgencia: "",
      logoUrl: "",
      sloganColor: "#c2410c",
      sloganFontFamily: "caveat",
      sloganFontUrl: "",
      titulo: "",
      subtitulo: "",
    },
  });

  useEffect(() => {
    if (contenido) {
      reset({
        nombreAgencia: contenido.nombreAgencia,
        logoUrl: contenido.logoUrl ?? "",
        sloganColor: contenido.sloganColor || "#c2410c",
        sloganFontFamily: contenido.sloganFontFamily || "caveat",
        sloganFontUrl: contenido.sloganFontUrl ?? "",
        titulo: contenido.titulo,
        subtitulo: contenido.subtitulo,
      });
    }
  }, [contenido, reset]);

  const guardar = useMutation({
    mutationFn: (values: FormPortada) =>
      apiFetch<ContenidoHome>("/contenido-home", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      toast.success("Portada actualizada");
      revalidarContenidoPublico();
      queryClient.setQueryData(QUERY_KEY, data);
      reset({
        nombreAgencia: data.nombreAgencia,
        logoUrl: data.logoUrl ?? "",
        sloganColor: data.sloganColor || "#c2410c",
        sloganFontFamily: data.sloganFontFamily || "caveat",
        sloganFontUrl: data.sloganFontUrl ?? "",
        titulo: data.titulo,
        subtitulo: data.subtitulo,
      });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la portada");
    },
  });

  const sloganFontUrlValue = watch("sloganFontUrl");
  const sloganFontFamilyValue = watch("sloganFontFamily");
  // Mientras el admin no guarde, el @font-face global (inyectado en
  // layout.tsx a partir de lo persistido en BD) todavía apunta a la
  // tipografía vieja. Por eso la vista previa de acá arma su propio
  // @font-face con un nombre de familia distinto, apuntando a lo que
  // haya en el form ahora mismo (guardado o no).
  const previewFontFamily = sloganFontUrlValue
    ? '"SloganPreviewCustom", cursive'
    : resolverFontFamilySlogan(sloganFontFamilyValue, null);

  async function handleSubirFuente(file: File | undefined) {
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".ttf", ".otf", ".woff", ".woff2"].includes(extension)) {
      toast.error("Usa un archivo TTF, OTF, WOFF o WOFF2");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo supera el máximo de 2 MB");
      return;
    }

    setSubiendoFuente(true);
    try {
      const { url } = await subirFuente(file);
      setValue("sloganFontUrl", url, { shouldDirty: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo subir la tipografía");
    } finally {
      setSubiendoFuente(false);
      if (inputFuenteRef.current) inputFuenteRef.current.value = "";
    }
  }

  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">Portada (hero)</h2>
      <form onSubmit={handleSubmit((v) => guardar.mutate(v))} className="grid gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink-800">Logo de la agencia</span>
          <div className="flex flex-wrap items-center gap-3">
            <div className="size-16 rounded-card border border-dashed border-sun-300 bg-sun-50/50 flex items-center justify-center overflow-hidden shrink-0">
              {watch("logoUrl") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={watch("logoUrl")}
                  alt="Logo actual"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
              ) : (
                <ImageOff className="size-5 text-ink-400" />
              )}
            </div>
            <BotonSubirArchivo
              carpeta="contenido"
              onSubido={(url) => setValue("logoUrl", url, { shouldDirty: true })}
            />
            <div className="flex-1 min-w-[220px]">
              <Input
                placeholder="O pega la URL de una imagen"
                error={errors.logoUrl?.message}
                {...register("logoUrl")}
              />
            </div>
            {watch("logoUrl") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue("logoUrl", "", { shouldDirty: true })}
              >
                <X className="size-4" />
                Quitar logo
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-400">
            Aparece en el menú superior y el pie de página de todo el sitio, incluso antes de
            iniciar sesión. Si no cargas un logo, se muestra un ícono genérico.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink-800">
            Nombre / slogan junto al logo
          </span>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <Input
                placeholder="Tu Agencia de Viajes"
                error={errors.nombreAgencia?.message}
                {...register("nombreAgencia")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sloganColor" className="text-sm font-medium text-ink-800">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="sloganColor"
                  type="color"
                  value={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(watch("sloganColor"))
                    ? watch("sloganColor")
                    : "#c2410c"}
                  onChange={(e) => setValue("sloganColor", e.target.value, { shouldDirty: true })}
                  className="size-10 rounded-lg border border-sun-200 cursor-pointer bg-white p-1"
                  aria-label="Color del slogan"
                />
                <Input
                  className="w-28"
                  error={errors.sloganColor?.message}
                  {...register("sloganColor")}
                />
              </div>
            </div>
          </div>
          <p
            className="text-3xl leading-none"
            style={{
              color: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(watch("sloganColor"))
                ? watch("sloganColor")
                : "#c2410c",
              fontFamily: previewFontFamily,
            }}
          >
            {watch("nombreAgencia") || "Tu Agencia de Viajes"}
          </p>
          {sloganFontUrlValue && (
            <style>{`
              @font-face {
                font-family: "SloganPreviewCustom";
                src: url("${sloganFontUrlValue}");
                font-display: swap;
              }
            `}</style>
          )}
          <p className="text-xs text-ink-400">
            Se muestra con tipografía manuscrita en el menú superior y el pie de página, tal
            como se ve en la vista previa de arriba.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink-800">Tipografía del slogan</span>
          <div className="flex flex-wrap gap-2">
            {FUENTES_SLOGAN.map((fuente) => (
              <button
                key={fuente.key}
                type="button"
                onClick={() => {
                  setValue("sloganFontFamily", fuente.key, { shouldDirty: true });
                  // Elegir un preset vuelve a él: si había una tipografía
                  // propia subida, deja de usarse (ver resolverFontFamilySlogan).
                  setValue("sloganFontUrl", "", { shouldDirty: true });
                }}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                  sloganFontFamilyValue === fuente.key && !sloganFontUrlValue
                    ? "border-clay-500 bg-clay-50 text-clay-700"
                    : "border-sun-200 bg-white text-ink-700 hover:border-sun-300"
                }`}
                style={{ fontFamily: `var(${fuente.cssVar})` }}
              >
                {fuente.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <input
              ref={inputFuenteRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
              className="hidden"
              onChange={(e) => handleSubirFuente(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={subiendoFuente}
              onClick={() => inputFuenteRef.current?.click()}
            >
              {subiendoFuente ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              {subiendoFuente
                ? "Subiendo..."
                : sloganFontUrlValue
                  ? "Cambiar tipografía propia"
                  : "Subir tipografía propia"}
            </Button>
            {sloganFontUrlValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue("sloganFontUrl", "", { shouldDirty: true })}
              >
                <X className="size-4" />
                Quitar tipografía propia
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-400">
            Elige una tipografía preseleccionada o sube la tuya (TTF, OTF, WOFF o WOFF2, máx.
            2 MB). Si subes una propia, esa es la que se usa hasta que la quites.
          </p>
        </div>

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

        <div>
          <Button type="submit" disabled={guardar.isPending || !isDirty}>
            <FileText className="size-4" />
            {guardar.isPending ? "Guardando..." : "Guardar portada"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// --- Quiénes somos: presentación, misión, visión, valores ---

const schemaQuienesSomos = z.object({
  presentacion: z.string().max(4000),
  mision: z.string().max(4000),
  vision: z.string().max(4000),
  valores: z.string().max(4000),
});

type FormQuienesSomos = z.infer<typeof schemaQuienesSomos>;

function SeccionQuienesSomos({ contenido }: { contenido?: ContenidoHome }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormQuienesSomos>({
    resolver: zodResolver(schemaQuienesSomos),
    defaultValues: { presentacion: "", mision: "", vision: "", valores: "" },
  });

  useEffect(() => {
    if (contenido) {
      reset({
        presentacion: contenido.presentacion,
        mision: contenido.mision,
        vision: contenido.vision,
        valores: contenido.valores,
      });
    }
  }, [contenido, reset]);

  const guardar = useMutation({
    mutationFn: (values: FormQuienesSomos) =>
      apiFetch<ContenidoHome>("/contenido-home", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      toast.success("Sección actualizada");
      revalidarContenidoPublico();
      queryClient.setQueryData(QUERY_KEY, data);
      reset({
        presentacion: data.presentacion,
        mision: data.mision,
        vision: data.vision,
        valores: data.valores,
      });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la sección");
    },
  });

  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">Quiénes somos</h2>
      <form onSubmit={handleSubmit((v) => guardar.mutate(v))} className="grid gap-4">
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

        <div>
          <Button type="submit" disabled={guardar.isPending || !isDirty}>
            <FileText className="size-4" />
            {guardar.isPending ? "Guardando..." : "Guardar sección"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// --- Contacto: se muestra en el footer público ---

const schemaContacto = z.object({
  telefono: z.string().max(50),
  correo: z.string().max(150),
  direccion: z.string().max(300),
});

type FormContacto = z.infer<typeof schemaContacto>;

function SeccionContacto({ contenido }: { contenido?: ContenidoHome }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormContacto>({
    resolver: zodResolver(schemaContacto),
    defaultValues: { telefono: "", correo: "", direccion: "" },
  });

  useEffect(() => {
    if (contenido) {
      reset({
        telefono: contenido.telefono ?? "",
        correo: contenido.correo ?? "",
        direccion: contenido.direccion ?? "",
      });
    }
  }, [contenido, reset]);

  const guardar = useMutation({
    mutationFn: (values: FormContacto) =>
      apiFetch<ContenidoHome>("/contenido-home", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      toast.success("Datos de contacto actualizados");
      revalidarContenidoPublico();
      queryClient.setQueryData(QUERY_KEY, data);
      reset({
        telefono: data.telefono ?? "",
        correo: data.correo ?? "",
        direccion: data.direccion ?? "",
      });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el contacto");
    },
  });

  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">Datos de contacto</h2>
      <p className="text-sm text-ink-600 mb-4">
        Aparecen en el pie de página de todo el sitio. Deja un campo vacío para que esa línea no
        se muestre.
      </p>
      <form onSubmit={handleSubmit((v) => guardar.mutate(v))} className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Teléfono"
          placeholder="+56 9 1234 5678"
          error={errors.telefono?.message}
          {...register("telefono")}
        />
        <Input
          label="Correo"
          placeholder="contacto@tuagencia.cl"
          error={errors.correo?.message}
          {...register("correo")}
        />
        <Input
          label="Dirección"
          placeholder="Av. Siempre Viva 123, Santiago"
          error={errors.direccion?.message}
          {...register("direccion")}
        />

        <div className="sm:col-span-3">
          <Button type="submit" disabled={guardar.isPending || !isDirty}>
            <FileText className="size-4" />
            {guardar.isPending ? "Guardando..." : "Guardar contacto"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// --- Reseñas de clientes ---

const resenaSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(150),
  texto: z.string().min(1, "Requerido").max(1000),
  valoracion: z.coerce.number().int().min(1).max(5).optional(),
});

const schemaResenas = z.object({
  resenas: z.array(resenaSchema).max(50),
});

type FormResenas = z.infer<typeof schemaResenas>;

function SeccionResenas({ contenido }: { contenido?: ContenidoHome }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormResenas>({
    resolver: zodResolver(schemaResenas),
    defaultValues: { resenas: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "resenas" });

  useEffect(() => {
    if (contenido) {
      reset({ resenas: contenido.resenas });
    }
  }, [contenido, reset]);

  const guardar = useMutation({
    mutationFn: (values: FormResenas) =>
      apiFetch<ContenidoHome>("/contenido-home", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      toast.success("Reseñas actualizadas");
      revalidarContenidoPublico();
      queryClient.setQueryData(QUERY_KEY, data);
      reset({ resenas: data.resenas });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudieron guardar las reseñas");
    },
  });

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit((v) => guardar.mutate(v))} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
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

        <div>
          <Button type="submit" disabled={guardar.isPending || !isDirty}>
            <FileText className="size-4" />
            {guardar.isPending ? "Guardando..." : "Guardar reseñas"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
