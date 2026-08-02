import type { Metadata } from "next";
import {
  Fraunces,
  Inter,
  Caveat,
  Dancing_Script,
  Pacifico,
  Sacramento,
  Shadows_Into_Light,
} from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { callBackend } from "@/lib/backend";
import { NOMBRE_FUENTE_CUSTOM, resolverFontFamilySlogan } from "@/lib/slogan-fonts";
import type { ContenidoHome } from "@/types";

// @ts-ignore: CSS module declarations may be missing in the project typings
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Tipografía "a mano alzada" para el slogan que acompaña al logo
// (Navbar/Footer). Se pidió específicamente que ese texto se vea
// manuscrito y no con la tipografía del resto del sitio.
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand-caveat",
  weight: ["500", "600", "700"],
});

// Alternativas manuscritas seleccionables por el admin para el slogan
// (ver src/lib/slogan-fonts.ts). Cada una define su propia CSS variable;
// solo se aplica la que corresponda según sloganFontFamily, pero
// cargarlas todas acá permite que next/font las optimice/precargue como
// con Caveat.
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-hand-dancing-script",
  weight: ["500", "600", "700"],
});

const pacifico = Pacifico({
  subsets: ["latin"],
  variable: "--font-hand-pacifico",
  weight: ["400"],
});

const sacramento = Sacramento({
  subsets: ["latin"],
  variable: "--font-hand-sacramento",
  weight: ["400"],
});

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  variable: "--font-hand-shadows",
  weight: ["400"],
});

// El nombre de la agencia se lee del contenido editable del panel admin
// (contenido-home) en vez de venir hardcodeado, para poder reutilizar
// este mismo frontend con distintos clientes sin tocar código.
//
// OJO rendimiento: antes esta función llamaba a callBackend() SIN
// `revalidate`, lo que activa `cache: "no-store"` (ver lib/backend.ts) —
// es decir, cada carga de CUALQUIER página (porque este layout envuelve
// toda la app) hacía un round-trip sin caché al backend. Y como
// generateMetadata() y RootLayout() llaman ambos a getNombreAgencia(),
// eran DOS requests sin caché por cada visita, más una tercera (esta sí
// cacheada 60s) que hace page.tsx en el home. Con `revalidate: 60` acá,
// Next reutiliza la misma respuesta cacheada entre generateMetadata,
// RootLayout y page.tsx durante esa ventana — de 2-3 llamadas sin caché
// por visita a, en la práctica, 0 la mayoría de las veces.
async function getContenidoBasico(): Promise<{
  nombreAgencia: string;
  logoUrl: string | null;
  sloganColor: string;
  sloganFontFamily: string;
  sloganFontUrl: string | null;
  colorFondo: string | null;
  colorNavbar: string | null;
  colorFooter: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
}> {
  const res = await callBackend<ContenidoHome>("/contenido-home", {
    revalidate: 60,
    tags: ["contenido-home"],
  });
  if (!res.ok) {
    return {
      nombreAgencia: "Tu Agencia de Viajes",
      logoUrl: null,
      sloganColor: "#c2410c",
      sloganFontFamily: "caveat",
      sloganFontUrl: null,
      colorFondo: null,
      colorNavbar: null,
      colorFooter: null,
      telefono: null,
      correo: null,
      direccion: null,
    };
  }
  return {
    nombreAgencia: res.data.nombreAgencia || "Tu Agencia de Viajes",
    logoUrl: res.data.logoUrl || null,
    sloganColor: res.data.sloganColor || "#c2410c",
    sloganFontFamily: res.data.sloganFontFamily || "caveat",
    sloganFontUrl: res.data.sloganFontUrl || null,
    colorFondo: res.data.colorFondo || null,
    colorNavbar: res.data.colorNavbar || null,
    colorFooter: res.data.colorFooter || null,
    telefono: res.data.telefono || null,
    correo: res.data.correo || null,
    direccion: res.data.direccion || null,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { nombreAgencia } = await getContenidoBasico();
  return {
    title: `${nombreAgencia} | Agencia de Turismo`,
    description: "Encuentra tu próximo destino, paquete u oferta de viaje.",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const {
    nombreAgencia,
    logoUrl,
    sloganColor,
    sloganFontFamily,
    sloganFontUrl,
    colorFondo,
    colorNavbar,
    colorFooter,
    telefono,
    correo,
    direccion,
  } = await getContenidoBasico();

  const sloganFontValue = resolverFontFamilySlogan(sloganFontFamily, sloganFontUrl);

  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${inter.variable} ${caveat.variable} ${dancingScript.variable} ${pacifico.variable} ${sacramento.variable} ${shadowsIntoLight.variable}`}
    >
      <body className="min-h-screen flex flex-col antialiased">
        {/* Paleta personalizada del sitio (color de fondo / navbar),
            elegida por el admin desde el panel (Contenido → Portada).
            Se inyecta como override de las variables por defecto
            declaradas en globals.css — si el admin no eligió un color
            propio, no se renderiza nada y se usan los valores por
            defecto. */}
        {(colorFondo || colorNavbar || colorFooter) && (
          <style>{`
            :root {
              ${colorFondo ? `--color-fondo-app: ${colorFondo};` : ""}
              ${colorNavbar ? `--color-navbar-app: ${colorNavbar};` : ""}
              ${colorFooter ? `--color-footer-app: ${colorFooter};` : ""}
            }
          `}</style>
        )}
        {/* Tipografía propia subida por el admin para el slogan (si la
            hay): se declara acá porque la URL es dinámica (dato de BD),
            así que no puede resolverse en build time como los next/font
            de arriba. */}
        {sloganFontUrl && (
          <style>{`
            @font-face {
              font-family: "${NOMBRE_FUENTE_CUSTOM}";
              src: url("${sloganFontUrl}");
              font-display: swap;
            }
          `}</style>
        )}
        <Providers>
          <Navbar
            nombreAgencia={nombreAgencia}
            logoUrl={logoUrl}
            sloganColor={sloganColor}
            sloganFontFamily={sloganFontValue}
          />
          <main className="flex-1">{children}</main>
          <Footer
            nombreAgencia={nombreAgencia}
            logoUrl={logoUrl}
            sloganColor={sloganColor}
            sloganFontFamily={sloganFontValue}
            telefono={telefono}
            correo={correo}
            direccion={direccion}
          />
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
