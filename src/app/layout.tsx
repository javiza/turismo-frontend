import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { callBackend } from "@/lib/backend";
import type { ContenidoHome } from "@/types";
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
async function getNombreAgencia(): Promise<string> {
  const res = await callBackend<ContenidoHome>("/contenido-home", { revalidate: 60 });
  return res.ok && res.data.nombreAgencia ? res.data.nombreAgencia : "Tu Agencia de Viajes";
}

export async function generateMetadata(): Promise<Metadata> {
  const nombreAgencia = await getNombreAgencia();
  return {
    title: `${nombreAgencia} | Agencia de Turismo`,
    description: "Encuentra tu próximo destino, paquete u oferta de viaje.",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nombreAgencia = await getNombreAgencia();

  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Navbar nombreAgencia={nombreAgencia} />
          <main className="flex-1">{children}</main>
          <Footer nombreAgencia={nombreAgencia} />
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
