"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRefrescarSitio } from "@/hooks/use-refrescar-sitio";
import {
  FileText,
  Plus,
  Trash2,
  ImageOff,
  X,
  UploadCloud,
  Loader2,
  Palette,
  Type,
  Globe,
  RefreshCw,
} from "lucide-react";
import { apiFetch, ApiError, subirFuente, subirFavicon } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BotonSubirArchivo } from "@/components/shared/galeria-imagenes";
import { SelectorColor, PALETA_TARJETAS } from "@/components/admin/selector-color";
import { FUENTES_SLOGAN, resolverFontFamilySlogan } from "@/lib/slogan-fonts";
import { FUENTES_SITIO, resolverFontFamilySitio, type RolFuente } from "@/lib/fuentes-sitio";
import type { ContenidoHome } from "@/types";

// Cada sección de este panel se guarda por separado (su propio form +
// mutation + botón "Guardar"), en vez de un único formulario gigante:
// un admin que solo quiere cambiar el teléfono no debería tener que
// revisar (ni arriesgarse a tocar sin querer) el resto del contenido.
// El backend ya soporta esto: PATCH /contenido-home actualiza solo las
// claves que llegan en el body (ver ContenidoService.actualizar).

const QUERY_KEY = ["admin-contenido-home"];

// El navbar/footer/home públicos cachean contenido-home por 60s (ISR).
// Tras cada guardado se usa useRefrescarSitio(): invalida ese caché y
// refresca la página abierta, para que el cambio se vea al instante en
// vez de esperar la ventana de 60s ni tener que recargar a mano — ver
// hooks/use-refrescar-sitio.ts.

export default function AdminContenidoPage() {
  const queryClient = useQueryClient();
  const refrescarSitio = useRefrescarSitio();
  const [actualizando, setActualizando] = useState(false);

  const { data: contenido, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<ContenidoHome>("/contenido-home"),
  });

  // Botón manual: vuelve a leer el contenido desde el servidor y refresca
  // la página (navbar, colores, tipografía, favicon), por si el admin
  // quiere ver el estado real del sitio sin recargar el navegador.
  async function actualizar() {
    setActualizando(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
        refrescarSitio(),
      ]);
      toast.success("Página actualizada");
    } finally {
      setActualizando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Contenido de la home
          </h1>
          <p className="text-sm text-ink-600">
            Este texto y las reseñas aparecen en la página de inicio pública. Cada sección se
            guarda de forma independiente y el cambio se aplica al instante.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={actualizando} onClick={actualizar}>
          {actualizando ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {actualizando ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-card bg-sun-100/60 animate-pulse" />
      ) : (
        <div className="flex flex-col gap-6">
          <SeccionFavicon contenido={contenido} />
          <SeccionPortada contenido={contenido} />
          <SeccionColores contenido={contenido} />
          <SeccionTipografia contenido={contenido} />
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
  heroImagenUrl: z.string().max(1000),
  heroImagenPosX: z.coerce.number().min(0).max(100),
  heroImagenPosY: z.coerce.number().min(0).max(100),
  heroImagenZoom: z.coerce.number().min(100).max(300),
});

type FormPortada = z.infer<typeof schemaPortada>;

function SeccionPortada({ contenido }: { contenido?: ContenidoHome }) {
  const queryClient = useQueryClient();
  const refrescarSitio = useRefrescarSitio();
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
      heroImagenUrl: "",
      heroImagenPosX: 50,
      heroImagenPosY: 50,
      heroImagenZoom: 100,
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
        heroImagenUrl: contenido.heroImagenUrl ?? "",
        heroImagenPosX: contenido.heroImagenPosX ?? 50,
        heroImagenPosY: contenido.heroImagenPosY ?? 50,
        heroImagenZoom: contenido.heroImagenZoom ?? 100,
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
      void refrescarSitio();
      queryClient.setQueryData(QUERY_KEY, data);
      reset({
        nombreAgencia: data.nombreAgencia,
        logoUrl: data.logoUrl ?? "",
        sloganColor: data.sloganColor || "#c2410c",
        sloganFontFamily: data.sloganFontFamily || "caveat",
        sloganFontUrl: data.sloganFontUrl ?? "",
        titulo: data.titulo,
        subtitulo: data.subtitulo,
        heroImagenUrl: data.heroImagenUrl ?? "",
        heroImagenPosX: data.heroImagenPosX ?? 50,
        heroImagenPosY: data.heroImagenPosY ?? 50,
        heroImagenZoom: data.heroImagenZoom ?? 100,
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

        <div className="flex flex-col gap-3 rounded-card border border-ink-100 p-4">
          <div>
            <span className="text-sm font-medium text-ink-800">Imagen de fondo del hero</span>
            <p className="text-xs text-ink-400 mt-0.5">
              Se muestra detrás del título/subtítulo en la home y en el banner de la sesión del
              cliente. Si no cargas ninguna, se usa la imagen por defecto del sitio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <BotonSubirArchivo
              carpeta="contenido"
              onSubido={(url) =>
                setValue("heroImagenUrl", url, { shouldDirty: true })
              }
            />
            <div className="flex-1 min-w-[220px]">
              <Input
                placeholder="O pega la URL de una imagen"
                error={errors.heroImagenUrl?.message}
                {...register("heroImagenUrl")}
              />
            </div>
            {watch("heroImagenUrl") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValue("heroImagenUrl", "", { shouldDirty: true });
                  setValue("heroImagenPosX", 50, { shouldDirty: true });
                  setValue("heroImagenPosY", 50, { shouldDirty: true });
                  setValue("heroImagenZoom", 100, { shouldDirty: true });
                }}
              >
                <X className="size-4" />
                Quitar imagen
              </Button>
            )}
          </div>

          {/* Vista previa: mismo recorte (object-cover) que se ve en el
              hero real, para que el admin ajuste posición y zoom viendo
              el resultado en vivo antes de guardar. */}
          <div className="relative h-40 sm:h-48 rounded-card overflow-hidden bg-sun-100 border border-sun-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={watch("heroImagenUrl") || "/images/hero-playa.webp"}
              alt="Vista previa de la imagen de fondo"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                objectPosition: `${watch("heroImagenPosX")}% ${watch("heroImagenPosY")}%`,
                transform: `scale(${watch("heroImagenZoom") / 100})`,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.visibility = "hidden";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/25 to-transparent pointer-events-none" />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="heroImagenPosX" className="text-xs font-medium text-ink-600">
                Encuadre horizontal ({Math.round(watch("heroImagenPosX"))}%)
              </label>
              <input
                id="heroImagenPosX"
                type="range"
                min={0}
                max={100}
                {...register("heroImagenPosX")}
                className="accent-clay-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="heroImagenPosY" className="text-xs font-medium text-ink-600">
                Encuadre vertical ({Math.round(watch("heroImagenPosY"))}%)
              </label>
              <input
                id="heroImagenPosY"
                type="range"
                min={0}
                max={100}
                {...register("heroImagenPosY")}
                className="accent-clay-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="heroImagenZoom" className="text-xs font-medium text-ink-600">
                Zoom ({Math.round(watch("heroImagenZoom"))}%)
              </label>
              <input
                id="heroImagenZoom"
                type="range"
                min={100}
                max={300}
                {...register("heroImagenZoom")}
                className="accent-clay-500"
              />
            </div>
          </div>
          <p className="text-xs text-ink-400">
            El encuadre define qué sección de la imagen queda visible; el zoom permite acercarla
            para mostrar solo una parte. Ambos se ven reflejados en la vista previa de arriba.
          </p>
        </div>

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

// --- Colores del sitio: fondo general, navbar, footer y tarjetas ---

const schemaColores = z.object({
  colorFondo: z
    .string()
    .regex(/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))?$/, "Debe ser un color hexadecimal, ej: #f8fbff"),
  colorNavbar: z
    .string()
    .regex(/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))?$/, "Debe ser un color hexadecimal, ej: #f8fbff"),
  colorFooter: z
    .string()
    .regex(/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))?$/, "Debe ser un color hexadecimal, ej: #f8fbff"),
  colorTarjetas: z
    .string()
    .regex(/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))?$/, "Debe ser un color hexadecimal, ej: #ffffff"),
});

type FormColores = z.infer<typeof schemaColores>;

function SeccionColores({ contenido }: { contenido?: ContenidoHome }) {
  const queryClient = useQueryClient();
  const refrescarSitio = useRefrescarSitio();

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormColores>({
    resolver: zodResolver(schemaColores),
    defaultValues: { colorFondo: "", colorNavbar: "", colorFooter: "", colorTarjetas: "" },
  });

  useEffect(() => {
    if (contenido) {
      reset({
        colorFondo: contenido.colorFondo ?? "",
        colorNavbar: contenido.colorNavbar ?? "",
        colorFooter: contenido.colorFooter ?? "",
        colorTarjetas: contenido.colorTarjetas ?? "",
      });
    }
  }, [contenido, reset]);

  const guardar = useMutation({
    mutationFn: (values: FormColores) =>
      apiFetch<ContenidoHome>("/contenido-home", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      toast.success("Colores actualizados");
      void refrescarSitio();
      queryClient.setQueryData(QUERY_KEY, data);
      reset({
        colorFondo: data.colorFondo ?? "",
        colorNavbar: data.colorNavbar ?? "",
        colorFooter: data.colorFooter ?? "",
        colorTarjetas: data.colorTarjetas ?? "",
      });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudieron guardar los colores");
    },
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Palette className="size-5 text-clay-600" />
        <h2 className="font-display text-lg font-semibold text-ink-900">Colores del sitio</h2>
      </div>
      <p className="text-sm text-ink-600 mb-4">
        Elige el color de fondo general, el del navbar, el del footer y el de los rectángulos
        (tarjetas) del sitio. Si no eliges ninguno, se usan los tonos por defecto.
      </p>
      <form onSubmit={handleSubmit((v) => guardar.mutate(v))} className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <SelectorColor
            label="Color de fondo"
            descripcion="Fondo general de las páginas públicas."
            value={watch("colorFondo")}
            onChange={(v) => setValue("colorFondo", v, { shouldDirty: true })}
          />
          <SelectorColor
            label="Color del navbar"
            descripcion="Fondo de la barra de navegación superior."
            value={watch("colorNavbar")}
            onChange={(v) => setValue("colorNavbar", v, { shouldDirty: true })}
          />
          <SelectorColor
            label="Color del footer"
            descripcion="Fondo del pie de página. Si no eliges uno, usa el mismo color que el navbar."
            value={watch("colorFooter")}
            onChange={(v) => setValue("colorFooter", v, { shouldDirty: true })}
          />
          <SelectorColor
            label="Color de los rectángulos"
            descripcion="Fondo de las tarjetas y cuadros de contenido (destinos, paquetes, paneles...). Por defecto, blanco."
            paleta={PALETA_TARJETAS}
            value={watch("colorTarjetas")}
            onChange={(v) => setValue("colorTarjetas", v, { shouldDirty: true })}
          />
        </div>
        {(errors.colorFondo || errors.colorNavbar || errors.colorFooter || errors.colorTarjetas) && (
          <p className="text-xs text-danger">
            {errors.colorFondo?.message ||
              errors.colorNavbar?.message ||
              errors.colorFooter?.message ||
              errors.colorTarjetas?.message}
          </p>
        )}
        <div>
          <Button type="submit" disabled={guardar.isPending || !isDirty}>
            <Palette className="size-4" />
            {guardar.isPending ? "Guardando..." : "Guardar colores"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// --- Tipografía general del sitio: texto y títulos ---

const schemaTipografia = z.object({
  fuenteTexto: z.string().min(1),
  fuenteTextoUrl: z.string().max(1000),
  fuenteTitulos: z.string().min(1),
  fuenteTitulosUrl: z.string().max(1000),
});

type FormTipografia = z.infer<typeof schemaTipografia>;

/**
 * Selector de una tipografía (preseleccionada o propia subida). Se usa
 * dos veces: texto general y títulos. Igual que con el slogan, si hay una
 * tipografía propia subida, esa tiene prioridad sobre la preseleccionada
 * hasta que se quite.
 */
function SelectorTipografia({
  rol,
  label,
  descripcion,
  fuenteKey,
  fuenteUrl,
  onElegirPreset,
  onCambiarUrl,
  textoEjemplo,
}: {
  rol: RolFuente;
  label: string;
  descripcion: string;
  fuenteKey: string;
  fuenteUrl: string;
  onElegirPreset: (key: string) => void;
  onCambiarUrl: (url: string) => void;
  textoEjemplo: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  // Mismo criterio que la portada: el @font-face global (layout.tsx) solo
  // refleja lo ya guardado, así que la vista previa arma el suyo, con otro
  // nombre de familia, apuntando a lo que haya en el form ahora mismo.
  const nombrePreview = rol === "texto" ? "TextoPreviewCustom" : "TitulosPreviewCustom";
  const previewFontFamily = fuenteUrl
    ? `"${nombrePreview}", ${rol === "texto" ? "sans-serif" : "serif"}`
    : resolverFontFamilySitio(rol, fuenteKey, null);

  async function handleSubir(file: File | undefined) {
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

    setSubiendo(true);
    try {
      const { url } = await subirFuente(file);
      onCambiarUrl(url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo subir la tipografía");
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-card border border-ink-100 p-4">
      <span className="text-sm font-medium text-ink-800">{label}</span>
      <p className="text-xs text-ink-400 -mt-1">{descripcion}</p>

      <div className="flex flex-wrap gap-2">
        {FUENTES_SITIO.map((fuente) => (
          <button
            key={fuente.key}
            type="button"
            onClick={() => {
              onElegirPreset(fuente.key);
              // Elegir un preset vuelve a él: si había una tipografía
              // propia subida, deja de usarse.
              onCambiarUrl("");
            }}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              fuenteKey === fuente.key && !fuenteUrl
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
          ref={inputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
          className="hidden"
          onChange={(e) => handleSubir(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={subiendo}
          onClick={() => inputRef.current?.click()}
        >
          {subiendo ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
          {subiendo
            ? "Subiendo..."
            : fuenteUrl
              ? "Cambiar tipografía propia"
              : "Subir tipografía propia"}
        </Button>
        {fuenteUrl && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onCambiarUrl("")}>
            <X className="size-4" />
            Quitar tipografía propia
          </Button>
        )}
      </div>

      {fuenteUrl && (
        <style>{`
          @font-face {
            font-family: "${nombrePreview}";
            src: url("${fuenteUrl}");
            font-display: swap;
          }
        `}</style>
      )}
      <div className="rounded-lg bg-sun-50/60 border border-sun-100 px-4 py-3">
        <p
          className={rol === "titulos" ? "text-2xl font-semibold text-ink-900" : "text-sm text-ink-800"}
          style={{ fontFamily: previewFontFamily }}
        >
          {textoEjemplo}
        </p>
      </div>
    </div>
  );
}

function SeccionTipografia({ contenido }: { contenido?: ContenidoHome }) {
  const queryClient = useQueryClient();
  const refrescarSitio = useRefrescarSitio();

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<FormTipografia>({
    resolver: zodResolver(schemaTipografia),
    defaultValues: {
      fuenteTexto: "inter",
      fuenteTextoUrl: "",
      fuenteTitulos: "fraunces",
      fuenteTitulosUrl: "",
    },
  });

  function valoresDesde(c: ContenidoHome): FormTipografia {
    return {
      fuenteTexto: c.fuenteTexto || "inter",
      fuenteTextoUrl: c.fuenteTextoUrl ?? "",
      fuenteTitulos: c.fuenteTitulos || "fraunces",
      fuenteTitulosUrl: c.fuenteTitulosUrl ?? "",
    };
  }

  useEffect(() => {
    if (contenido) reset(valoresDesde(contenido));
  }, [contenido, reset]);

  const guardar = useMutation({
    mutationFn: (values: FormTipografia) =>
      apiFetch<ContenidoHome>("/contenido-home", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      toast.success("Tipografía actualizada");
      void refrescarSitio();
      queryClient.setQueryData(QUERY_KEY, data);
      reset(valoresDesde(data));
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la tipografía");
    },
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Type className="size-5 text-clay-600" />
        <h2 className="font-display text-lg font-semibold text-ink-900">Tipografía del sitio</h2>
      </div>
      <p className="text-sm text-ink-600 mb-4">
        Cambia la letra de todo el sitio: una para los textos y otra para los títulos. Elige una
        de la lista o sube la tuya. (El slogan de la agencia se configura aparte, en Portada.)
      </p>
      <form onSubmit={handleSubmit((v) => guardar.mutate(v))} className="flex flex-col gap-5">
        <SelectorTipografia
          rol="texto"
          label="Tipografía de los textos"
          descripcion="Párrafos, botones, menús, formularios y el resto del contenido."
          fuenteKey={watch("fuenteTexto")}
          fuenteUrl={watch("fuenteTextoUrl")}
          onElegirPreset={(k) => setValue("fuenteTexto", k, { shouldDirty: true })}
          onCambiarUrl={(u) => setValue("fuenteTextoUrl", u, { shouldDirty: true })}
          textoEjemplo="Arma tu próximo viaje con destinos, paquetes y ofertas curadas por nuestro equipo."
        />
        <SelectorTipografia
          rol="titulos"
          label="Tipografía de los títulos"
          descripcion="Encabezados de las páginas y de cada sección."
          fuenteKey={watch("fuenteTitulos")}
          fuenteUrl={watch("fuenteTitulosUrl")}
          onElegirPreset={(k) => setValue("fuenteTitulos", k, { shouldDirty: true })}
          onCambiarUrl={(u) => setValue("fuenteTitulosUrl", u, { shouldDirty: true })}
          textoEjemplo="Programa tus vacaciones con nosotros"
        />
        <p className="text-xs text-ink-400">
          Tipografía propia: TTF, OTF, WOFF o WOFF2, máx. 2 MB. Si subes una, esa se usa hasta
          que la quites. Asegúrate de tener licencia para usarla en tu sitio web.
        </p>
        <div>
          <Button type="submit" disabled={guardar.isPending || !isDirty}>
            <Type className="size-4" />
            {guardar.isPending ? "Guardando..." : "Guardar tipografía"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// --- Favicon: ícono de la pestaña del navegador ---

const EXTENSIONES_FAVICON = [".png", ".ico", ".svg", ".jpg", ".jpeg"];

function SeccionFavicon({ contenido }: { contenido?: ContenidoHome }) {
  const queryClient = useQueryClient();
  const refrescarSitio = useRefrescarSitio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const guardado = contenido?.faviconUrl ?? "";
  // "" = sin favicon. Se edita localmente y recién se aplica al sitio al
  // presionar "Guardar favicon", como el resto de las secciones.
  const [faviconUrl, setFaviconUrl] = useState(guardado);

  useEffect(() => {
    setFaviconUrl(guardado);
  }, [guardado]);

  const guardar = useMutation({
    mutationFn: (url: string) =>
      apiFetch<ContenidoHome>("/contenido-home", {
        method: "PATCH",
        body: JSON.stringify({ faviconUrl: url }),
      }),
    onSuccess: (data) => {
      toast.success("Favicon actualizado");
      void refrescarSitio();
      queryClient.setQueryData(QUERY_KEY, data);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el favicon");
    },
  });

  // Título de la pestaña del navegador (el <title> que va al lado del
  // favicon). Independiente de la frase junto al logo (nombreAgencia, ver
  // SeccionPortada): antes se usaba el mismo texto para ambos, ahora se
  // editan por separado. "" guardado = el sitio usa el título por
  // defecto (nombre de la agencia + " | Agencia de Turismo").
  const tituloPestanaGuardado = contenido?.tituloPestana ?? "";
  const [tituloPestana, setTituloPestana] = useState(tituloPestanaGuardado);

  useEffect(() => {
    setTituloPestana(tituloPestanaGuardado);
  }, [tituloPestanaGuardado]);

  const guardarTituloPestana = useMutation({
    mutationFn: (valor: string) =>
      apiFetch<ContenidoHome>("/contenido-home", {
        method: "PATCH",
        body: JSON.stringify({ tituloPestana: valor }),
      }),
    onSuccess: (data) => {
      toast.success("Título de la pestaña actualizado");
      void refrescarSitio();
      queryClient.setQueryData(QUERY_KEY, data);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "No se pudo guardar el título de la pestaña",
      );
    },
  });

  const tituloPestanaCambiado = tituloPestana !== tituloPestanaGuardado;
  const tituloPestanaPreview =
    tituloPestana.trim() || `${contenido?.nombreAgencia || "Tu Agencia de Viajes"} | Agencia de Turismo`;

  async function handleSubir(file: File | undefined) {
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!EXTENSIONES_FAVICON.includes(extension)) {
      toast.error("Usa un archivo PNG, ICO, SVG o JPG");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error("El favicon supera el máximo de 1 MB");
      return;
    }

    setSubiendo(true);
    try {
      const { url } = await subirFavicon(file);
      setFaviconUrl(url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo subir el favicon");
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const cambiado = faviconUrl !== guardado;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Globe className="size-5 text-clay-600" />
        <h2 className="font-display text-lg font-semibold text-ink-900">Favicon</h2>
      </div>
      <p className="text-sm text-ink-600 mb-4">
        Es el ícono pequeño que aparece en la pestaña del navegador y en los marcadores. Súbelo
        desde tu computador.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Vista previa: cómo se ve en una pestaña + tamaño ampliado */}
          <div className="flex items-center gap-2 rounded-t-lg border border-ink-100 bg-sun-50/60 px-3 py-2 min-w-48 max-w-64">
            {faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={faviconUrl} alt="" className="size-4 object-contain shrink-0" />
            ) : (
              <Globe className="size-4 text-ink-400 shrink-0" />
            )}
            <span className="text-xs text-ink-800 truncate">{tituloPestanaPreview}</span>
          </div>
          <div className="size-16 rounded-card border border-dashed border-sun-300 bg-sun-50/50 flex items-center justify-center overflow-hidden shrink-0">
            {faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={faviconUrl} alt="Favicon actual" className="size-12 object-contain" />
            ) : (
              <ImageOff className="size-6 text-ink-400" />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".png,.ico,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/jpeg"
            className="hidden"
            onChange={(e) => handleSubir(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
          >
            {subiendo ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
            {subiendo ? "Subiendo..." : faviconUrl ? "Cambiar favicon" : "Subir favicon"}
          </Button>
          {faviconUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setFaviconUrl("")}>
              <X className="size-4" />
              Quitar favicon
            </Button>
          )}
        </div>

        <p className="text-xs text-ink-400">
          Formatos: PNG, ICO, SVG o JPG, máx. 1 MB. Lo ideal es una imagen cuadrada (por ejemplo
          64×64 o 512×512 px). Los navegadores guardan el favicon en caché: tras guardarlo, puede
          tardar unos minutos en cambiar, o recarga la página con Ctrl+F5.
        </p>

        <div>
          <Button
            type="button"
            disabled={guardar.isPending || !cambiado}
            onClick={() => guardar.mutate(faviconUrl)}
          >
            <Globe className="size-4" />
            {guardar.isPending ? "Guardando..." : "Guardar favicon"}
          </Button>
        </div>

        <hr className="border-sun-100" />

        <div className="flex flex-col gap-2">
          <label htmlFor="tituloPestana" className="text-sm font-medium text-ink-800">
            Título de la pestaña
          </label>
          <p className="text-xs text-ink-500">
            Es el texto que aparece en la pestaña del navegador, junto al favicon. Es
            independiente de la frase que va junto al logo (esa se edita en Portada). Déjalo
            vacío para usar el título por defecto.
          </p>
          <Input
            id="tituloPestana"
            value={tituloPestana}
            onChange={(e) => setTituloPestana(e.target.value)}
            maxLength={150}
            placeholder={`${contenido?.nombreAgencia || "Tu Agencia de Viajes"} | Agencia de Turismo`}
          />
        </div>

        <div>
          <Button
            type="button"
            disabled={guardarTituloPestana.isPending || !tituloPestanaCambiado}
            onClick={() => guardarTituloPestana.mutate(tituloPestana)}
          >
            <Globe className="size-4" />
            {guardarTituloPestana.isPending ? "Guardando..." : "Guardar título de la pestaña"}
          </Button>
        </div>
      </div>
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
  const refrescarSitio = useRefrescarSitio();

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
      void refrescarSitio();
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
  const refrescarSitio = useRefrescarSitio();

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
      void refrescarSitio();
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
  const refrescarSitio = useRefrescarSitio();

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
      void refrescarSitio();
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
