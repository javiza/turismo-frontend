// Tipografías generales del sitio que el admin puede elegir (texto de la
// UI y títulos). Cada key se carga en layout.tsx vía next/font/google con
// su propia CSS variable (--font-<key>); acá mapeamos key -> (label para
// el selector, variable CSS, tipo genérico para el fallback).
//
// OJO: si agregas o quitas una fuente acá, actualiza también:
// - layout.tsx (import del font de next/font/google + su className)
// - backend/src/contenido/dto/update-contenido-home.dto.ts (FUENTES_SITIO_KEYS)
export const FUENTES_SITIO = [
  { key: "inter", label: "Inter", cssVar: "--font-inter", tipo: "sans" },
  { key: "poppins", label: "Poppins", cssVar: "--font-poppins", tipo: "sans" },
  { key: "roboto", label: "Roboto", cssVar: "--font-roboto", tipo: "sans" },
  { key: "open-sans", label: "Open Sans", cssVar: "--font-open-sans", tipo: "sans" },
  { key: "lato", label: "Lato", cssVar: "--font-lato", tipo: "sans" },
  { key: "montserrat", label: "Montserrat", cssVar: "--font-montserrat", tipo: "sans" },
  { key: "nunito", label: "Nunito", cssVar: "--font-nunito", tipo: "sans" },
  { key: "dm-sans", label: "DM Sans", cssVar: "--font-dm-sans", tipo: "sans" },
  { key: "fraunces", label: "Fraunces", cssVar: "--font-fraunces", tipo: "serif" },
  { key: "playfair-display", label: "Playfair Display", cssVar: "--font-playfair", tipo: "serif" },
  { key: "merriweather", label: "Merriweather", cssVar: "--font-merriweather", tipo: "serif" },
  { key: "lora", label: "Lora", cssVar: "--font-lora", tipo: "serif" },
] as const;

export type FuenteSitioKey = (typeof FUENTES_SITIO)[number]["key"];

/** Lo que el sitio usaba antes de que fuera editable (no cambia el aspecto actual). */
export const FUENTE_TEXTO_DEFAULT: FuenteSitioKey = "inter";
export const FUENTE_TITULOS_DEFAULT: FuenteSitioKey = "fraunces";

/** Nombres de familia de los @font-face generados para tipografías propias subidas por el admin. */
export const NOMBRE_FUENTE_TEXTO_CUSTOM = "TextoCustom";
export const NOMBRE_FUENTE_TITULOS_CUSTOM = "TitulosCustom";

export type RolFuente = "texto" | "titulos";

const FALLBACK_SANS = "ui-sans-serif, system-ui, sans-serif";
const FALLBACK_SERIF = "ui-serif, Georgia, serif";

/**
 * Resuelve el valor CSS `font-family` para el texto general o los
 * títulos. Una tipografía propia subida (url) tiene prioridad sobre la
 * preseleccionada (key), igual que con el slogan.
 */
export function resolverFontFamilySitio(
  rol: RolFuente,
  key: string | null | undefined,
  url: string | null | undefined,
): string {
  const defaultKey = rol === "texto" ? FUENTE_TEXTO_DEFAULT : FUENTE_TITULOS_DEFAULT;
  const fallbackRol = rol === "texto" ? FALLBACK_SANS : FALLBACK_SERIF;

  if (url) {
    const nombre = rol === "texto" ? NOMBRE_FUENTE_TEXTO_CUSTOM : NOMBRE_FUENTE_TITULOS_CUSTOM;
    return `"${nombre}", ${fallbackRol}`;
  }

  const preset =
    FUENTES_SITIO.find((f) => f.key === key) ?? FUENTES_SITIO.find((f) => f.key === defaultKey)!;
  return `var(${preset.cssVar}), ${preset.tipo === "serif" ? FALLBACK_SERIF : FALLBACK_SANS}`;
}
