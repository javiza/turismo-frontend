import Image from "next/image";
import { Percent } from "lucide-react";
import { callBackend } from "@/lib/backend";
import { Card } from "@/components/ui/card";
import { PaqueteAcciones } from "@/components/paquetes/paquete-acciones";
import { PrecioPaquete } from "@/components/paquetes/precio-paquete";
import { GaleriaLightbox } from "@/components/shared/galeria-lightbox";
import { Carrusel, CarruselItem } from "@/components/shared/carrusel";
import type { Oferta } from "@/types";

export const metadata = { title: "Ofertas" };

export default async function OfertasPage() {
  const res = await callBackend<Oferta[]>("/ofertas", { revalidate: 60 });
  const ofertas = res.ok ? res.data : [];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
      <h1 className="font-display text-3xl font-semibold text-ink-900 mb-8">Ofertas activas</h1>

      {ofertas.length === 0 ? (
        <p className="text-ink-400">No hay ofertas activas en este momento.</p>
      ) : (
        <Carrusel>
          {ofertas.map((o) => {
            // El precio base es el del paquete asociado; el descuento de
            // la oferta se aplica sobre ese precio para mostrar el
            // tachado + precio final, igual que en el resto del sitio.
            const precioBase = o.paquete ? Number(o.paquete.precio) : undefined;
            const precioConDescuento =
              precioBase != null
                ? Number((precioBase * (1 - Number(o.descuento) / 100)).toFixed(2))
                : undefined;

            return (
              <CarruselItem key={o.id}>
                <Card className="overflow-hidden flex flex-col gap-4 bg-gradient-to-br from-clay-50 to-sun-50 h-full p-0">
                  {(o.imagenPrincipal || (o.imagenes && o.imagenes.length > 0)) && (
                    <GaleriaLightbox imagenes={o.imagenes} imagenPrincipal={o.imagenPrincipal} nombre={o.titulo}>
                      <div className="relative h-40 bg-sun-100">
                        {o.imagenPrincipal && (
                          <Image src={o.imagenPrincipal} alt={o.titulo} fill className="object-cover" />
                        )}
                      </div>
                    </GaleriaLightbox>
                  )}
                  <div className="p-6 pt-4 flex flex-col gap-4 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="size-11 rounded-full bg-clay-500 text-white flex items-center justify-center shrink-0">
                        <Percent className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-ink-900">{o.titulo}</h3>
                        {o.descripcion && <p className="text-sm text-ink-600">{o.descripcion}</p>}
                        <p className="text-xs text-clay-600 font-medium mt-1">
                          {Number(o.descuento)}% de descuento
                          {o.paquete && <> · {o.paquete.nombre}</>}
                        </p>
                      </div>
                    </div>
                    {precioBase != null && precioConDescuento != null && (
                      <PrecioPaquete precio={precioConDescuento} precioAnterior={precioBase} />
                    )}
                    {o.paquete && (
                      <PaqueteAcciones paqueteId={o.paquete.id} paqueteNombre={o.paquete.nombre} />
                    )}
                  </div>
                </Card>
              </CarruselItem>
            );
          })}
        </Carrusel>
      )}
    </div>
  );
}
