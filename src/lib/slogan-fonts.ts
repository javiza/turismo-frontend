// Tipografías manuscritas preseleccionadas que el admin puede elegir
// para el slogan (nombreAgencia en Navbar/Footer). Cada key se carga en
// layout.tsx vía next/font/google con su propia CSS variable (--font-hand-<key>)
// y acá solo mapeamos key -> (label para el selector, variable CSS a
// usar como font-family).
//
// OJO: si agregas o quitas una fuente acá, actualiza también:
// - layout.tsx (import del font de next/font/google + su className)
// - backend/src/contenido/dto/update-contenido-home.dto.ts (FUENTES_SLOGAN_KEYS)
export const FUENTES_SLOGAN = [
  { key: "caveat", label: "Caveat (la de siempre)", cssVar: "--font-hand-caveat" },
  { key: "dancing-script", label: "Dancing Script", cssVar: "--font-hand-dancing-script" },
  { key: "pacifico", label: "Pacifico", cssVar: "--font-hand-pacifico" },
  { key: "sacramento", label: "Sacramento", cssVar: "--font-hand-sacramento" },
  { key: "shadows-into-light", label: "Shadows Into Light", cssVar: "--font-hand-shadows" },
] as const;

export type FuenteSloganKey = (typeof FUENTES_SLOGAN)[number]["key"];

const DEFAULT_KEY: FuenteSloganKey = "caveat";

/** Nombre de familia usado en el @font-face que se genera para una tipografía custom subida por el admin. */
export const NOMBRE_FUENTE_CUSTOM = "SloganCustom";

/**
 * Resuelve el valor CSS `font-family` a aplicar al slogan según lo
 * guardado en ContenidoHome. Si hay una tipografía propia subida
 * (sloganFontUrl), esa tiene prioridad sobre la preseleccionada.
 */
export function resolverFontFamilySlogan(
  sloganFontFamily: string | null | undefined,
  sloganFontUrl: string | null | undefined,
): string {
  if (sloganFontUrl) {
    return `"${NOMBRE_FUENTE_CUSTOM}", cursive`;
  }
  const preset =
    FUENTES_SLOGAN.find((f) => f.key === sloganFontFamily) ??
    FUENTES_SLOGAN.find((f) => f.key === DEFAULT_KEY)!;
  return `var(${preset.cssVar})`;
}
