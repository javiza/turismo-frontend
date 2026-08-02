import { ImagenSegura } from "@/components/shared/imagen-segura";
import { MapPin } from "lucide-react";
import { callBackend } from "@/lib/backend";
import { Card } from "@/components/ui/card";
import { DestinoAcciones } from "@/components/destinos/destino-acciones";
import { PrecioDestino } from "@/components/destinos/precio-destino";
import { DisponibilidadDestino } from "@/components/destinos/disponibilidad-destino";
import { GaleriaLightbox } from "@/components/shared/galeria-lightbox";
import type { Destino } from "@/types";

export const metadata = { title: "Destinos" };

export default async function DestinosPage() {
  const res = await callBackend<Destino[]>("/destinos", { revalidate: 60 });
  const destinos = res.ok ? res.data : [];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
      <h1 className="font-display text-3xl font-semibold text-ink-900 mb-8">Todos los destinos</h1>

      {destinos.length === 0 ? (
        <p className="text-ink-400">No hay destinos disponibles por ahora.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinos.map((d) => (
            <Card key={d.id} className="overflow-hidden">
              <GaleriaLightbox imagenes={d.imagenes} imagenPrincipal={d.imagenPrincipal} nombre={d.nombre}>
                <div className="relative h-44 bg-sun-100">
                  {d.imagenPrincipal && (
                    <ImagenSegura src={d.imagenPrincipal} alt={d.nombre} fill className="object-cover" />
                  )}
                </div>
              </GaleriaLightbox>
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-clay-600 font-medium mb-1.5">
                  <MapPin className="size-3.5" />
                  {d.ciudad}, {d.pais}
                </div>
                <h3 className="font-display text-lg font-semibold text-ink-900">{d.nombre}</h3>
                <p className="mt-1.5 text-sm text-ink-600 line-clamp-3">{d.descripcion}</p>
                <div className="mt-1.5">
                  <PrecioDestino precioDesde={d.precioDesde} />
                </div>
                <div className="mt-1">
                  <DisponibilidadDestino fechaInicio={d.fechaInicio} fechaFin={d.fechaFin} />
                </div>
                <DestinoAcciones destinoId={d.id} destinoNombre={d.nombre} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
