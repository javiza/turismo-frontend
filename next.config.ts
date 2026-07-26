import type { NextConfig } from "next";

// OJO rendimiento: cada imagen remota pasa por el optimizador de Next
// (/_next/image): la descarga, la redimensiona y la re-codifica en el
// propio servidor antes de servirla. Eso es trabajo redundante para las
// fotos subidas por el admin (van a Cloudinary con
// `quality: auto, fetch_format: auto`, ver storage/cloudinary.service.ts,
// que ya las sirve optimizadas desde su propio CDN), pero no podemos
// restringir remotePatterns a solo Cloudinary porque la galería también
// permite pegar una URL externa cualquiera (ver
// components/shared/galeria-imagenes.tsx) — restringir el host rompería
// esas imágenes ("invalid src" de next/image). En vez de eso, subimos
// minimumCacheTTL para que, una vez optimizada una imagen, Next la sirva
// desde caché mucho más tiempo en vez de reprocesarla seguido.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 días
  },
};

export default nextConfig;
