import type { Metadata } from "next";
import {
  Fraunces,
  Inter,
  Poppins,
  Roboto,
  Open_Sans,
  Lato,
  Montserrat,
  Nunito,
  DM_Sans,
  Playfair_Display,
  Merriweather,
  Lora,
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
import { construirCssTema } from "@/lib/tema-sitio";
import type { ContenidoHome } from "@/types";

import "./globals.css";

// Tipografía general del sitio (texto y títulos). Fraunces e Inter son los
// valores por defecto; las demás son alternativas que el admin puede elegir
// desde Contenido → Tipografía del sitio (ver src/lib/fuentes-sitio.ts).
//
// Cada fuente expone su propia CSS variable (--font-<nombre>) y globals.css
// arma --font-sans / --font-display a partir de ellas. Se cargan todas con
// `preload: false`: el navegador solo descarga los archivos de la que
// realmente se use (el @font-face se declara igual, pero no se precarga),
// así que tener 12 opciones no encarece la carga de la página.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto", preload: false });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", preload: false });
const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: ["400", "700"],
  preload: false,
});
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", preload: false });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", preload: false });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  preload: false,
});
const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-merriweather",
  preload: false,
});
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", preload: false });

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
  colorTarjetas: string | null;
  faviconUrl: string | null;
  tituloPestana: string | null;
  fuenteTexto: string;
  fuenteTextoUrl: string | null;
  fuenteTitulos: string;
  fuenteTitulosUrl: string | null;
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
      colorTarjetas: null,
      faviconUrl: null,
      tituloPestana: null,
      fuenteTexto: "inter",
      fuenteTextoUrl: null,
      fuenteTitulos: "fraunces",
      fuenteTitulosUrl: null,
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
    colorTarjetas: res.data.colorTarjetas || null,
    faviconUrl: res.data.faviconUrl || null,
    tituloPestana: res.data.tituloPestana || null,
    fuenteTexto: res.data.fuenteTexto || "inter",
    fuenteTextoUrl: res.data.fuenteTextoUrl || null,
    fuenteTitulos: res.data.fuenteTitulos || "fraunces",
    fuenteTitulosUrl: res.data.fuenteTitulosUrl || null,
    telefono: res.data.telefono || null,
    correo: res.data.correo || null,
    direccion: res.data.direccion || null,
  };
}

// MIME del favicon según la extensión de la URL guardada (Cloudinary
// conserva la extensión original). Declararlo ayuda a los navegadores a
// elegir bien cuando hay varios íconos; si no se reconoce, se omite.
function tipoMimeFavicon(url: string): string | undefined {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ico":
      return "image/x-icon";
    case "png":
      return "image/png";
    case "svg":
      return "image/svg+xml";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return undefined;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { nombreAgencia, faviconUrl, tituloPestana } = await getContenidoBasico();
  const tipo = faviconUrl ? tipoMimeFavicon(faviconUrl) : undefined;
  return {
    // Título de la pestaña del navegador: independiente de la frase que
    // acompaña al logo (nombreAgencia, Navbar/Footer). Si el admin no ha
    // cargado uno propio (Contenido → Favicon), se mantiene el título
    // por defecto de siempre.
    title: tituloPestana?.trim() ? tituloPestana : `${nombreAgencia} | Agencia de Turismo`,
    description: "Encuentra tu próximo destino, paquete u oferta de viaje.",
    // Favicon subido por el admin (Contenido → Favicon). Sin favicon no
    // se declara ningún ícono.
    ...(faviconUrl
      ? {
          icons: {
            icon: [{ url: faviconUrl, ...(tipo ? { type: tipo } : {}) }],
            shortcut: faviconUrl,
            apple: faviconUrl,
          },
        }
      : {}),
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
    colorTarjetas,
    fuenteTexto,
    fuenteTextoUrl,
    fuenteTitulos,
    fuenteTitulosUrl,
    telefono,
    correo,
    direccion,
  } = await getContenidoBasico();

  // Colores (fondo, navbar, footer, tarjetas) y tipografía general del
  // sitio elegidos por el admin. Devuelve "" si no personalizó nada.
  const cssTema = construirCssTema({
    colorFondo,
    colorNavbar,
    colorFooter,
    colorTarjetas,
    fuenteTexto,
    fuenteTextoUrl,
    fuenteTitulos,
    fuenteTitulosUrl,
  });

  const sloganFontValue = resolverFontFamilySlogan(sloganFontFamily, sloganFontUrl);

  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${inter.variable} ${poppins.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${montserrat.variable} ${nunito.variable} ${dmSans.variable} ${playfair.variable} ${merriweather.variable} ${lora.variable} ${caveat.variable} ${dancingScript.variable} ${pacifico.variable} ${sacramento.variable} ${shadowsIntoLight.variable}`}
    >
      <body className="min-h-screen flex flex-col antialiased">
        {/* Personalización del sitio elegida por el admin desde el panel
            (Contenido → Colores / Tipografía): color de fondo, navbar,
            footer y tarjetas, más la tipografía general. Se inyecta como
            override de las variables por defecto declaradas en
            globals.css — si el admin no personalizó nada, no se renderiza
            ningún <style> y se usan los valores por defecto. */}
        {cssTema && <style>{cssTema}</style>}
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
