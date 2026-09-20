import { esColorOscuro, esHexValido } from "@/lib/color";
import {
  FUENTE_TEXTO_DEFAULT,
  FUENTE_TITULOS_DEFAULT,
  NOMBRE_FUENTE_TEXTO_CUSTOM,
  NOMBRE_FUENTE_TITULOS_CUSTOM,
  resolverFontFamilySitio,
} from "@/lib/fuentes-sitio";

/** Personalización visual del sitio que el admin edita desde Contenido. */
export interface TemaSitio {
  colorFondo: string | null;
  colorNavbar: string | null;
  colorFooter: string | null;
  colorTarjetas: string | null;
  fuenteTexto: string;
  fuenteTextoUrl: string | null;
  fuenteTitulos: string;
  fuenteTitulosUrl: string | null;
}

/**
 * Las URLs de tipografías propias vienen de la BD y se insertan dentro de
 * un `url("...")` en CSS. Solo aceptamos http(s) y neutralizamos cualquier
 * carácter que permita salirse de las comillas.
 */
function urlSeguraParaCss(url: string | null): string | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return url.replace(/["'()\\\s<>]/g, (c) => encodeURIComponent(c));
}

/**
 * Con una tarjeta oscura, el texto/bordes por defecto (tonos "ink" oscuros)
 * quedarían ilegibles. Reasignamos esas variables solo dentro de la
 * tarjeta: los `text-ink-*` de Tailwind v4 leen `var(--color-ink-*)`, así
 * que se reescriben solos sin tocar ningún componente. Los campos de
 * formulario (fondo blanco) conservan su texto oscuro.
 */
const REGLAS_TARJETA_OSCURA = `
  .tarjeta-app {
    --color-ink-900: #f8fafc;
    --color-ink-800: #e5e9f0;
    --color-ink-600: #cbd5e1;
    --color-ink-400: #9aa7bd;
    --color-ink-100: rgba(255, 255, 255, 0.16);
    --color-sun-100: rgba(255, 255, 255, 0.16);
  }
  .tarjeta-app :is(input, textarea, select) {
    --color-ink-900: #1b2230;
    --color-ink-800: #2b3444;
    --color-ink-600: #47536b;
    --color-ink-400: #74809a;
  }
`;

/**
 * Construye el CSS que aplica la personalización del admin por encima de
 * los valores por defecto de globals.css. Devuelve "" si no hay nada
 * personalizado (en ese caso el layout no renderiza ningún <style>).
 *
 * Usamos `html:root` (más específico que `:root` y que la clase con la que
 * next/font declara sus variables) para que el override gane siempre, sin
 * depender del orden en que el navegador cargue las hojas de estilo.
 */
export function construirCssTema(tema: TemaSitio): string {
  const variables: string[] = [];
  const extra: string[] = [];

  if (esHexValido(tema.colorFondo)) variables.push(`--color-fondo-app: ${tema.colorFondo};`);
  if (esHexValido(tema.colorNavbar)) variables.push(`--color-navbar-app: ${tema.colorNavbar};`);
  if (esHexValido(tema.colorFooter)) variables.push(`--color-footer-app: ${tema.colorFooter};`);

  if (esHexValido(tema.colorTarjetas)) {
    variables.push(`--color-tarjeta-app: ${tema.colorTarjetas};`);
    if (esColorOscuro(tema.colorTarjetas)) extra.push(REGLAS_TARJETA_OSCURA);
  }

  const urlTexto = urlSeguraParaCss(tema.fuenteTextoUrl);
  if (urlTexto) {
    extra.push(
      `@font-face { font-family: "${NOMBRE_FUENTE_TEXTO_CUSTOM}"; src: url("${urlTexto}"); font-display: swap; }`,
    );
  }
  if (urlTexto || (tema.fuenteTexto && tema.fuenteTexto !== FUENTE_TEXTO_DEFAULT)) {
    variables.push(`--font-sans: ${resolverFontFamilySitio("texto", tema.fuenteTexto, urlTexto)};`);
  }

  const urlTitulos = urlSeguraParaCss(tema.fuenteTitulosUrl);
  if (urlTitulos) {
    extra.push(
      `@font-face { font-family: "${NOMBRE_FUENTE_TITULOS_CUSTOM}"; src: url("${urlTitulos}"); font-display: swap; }`,
    );
  }
  if (urlTitulos || (tema.fuenteTitulos && tema.fuenteTitulos !== FUENTE_TITULOS_DEFAULT)) {
    variables.push(
      `--font-display: ${resolverFontFamilySitio("titulos", tema.fuenteTitulos, urlTitulos)};`,
    );
  }

  if (variables.length === 0 && extra.length === 0) return "";

  const raiz = variables.length ? `html:root { ${variables.join(" ")} }` : "";
  return [raiz, ...extra].join("\n");
}
