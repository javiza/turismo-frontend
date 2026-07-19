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
async function getNombreAgencia(): Promise<string> {
  const res = await callBackend<ContenidoHome>("/contenido-home");
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
