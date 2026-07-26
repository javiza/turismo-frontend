import { ImagenSegura } from "@/components/shared/imagen-segura";
import { CalendarDays } from "lucide-react";
import { callBackend } from "@/lib/backend";
import { Card } from "@/components/ui/card";
import { PaqueteAcciones } from "@/components/paquetes/paquete-acciones";
import { PrecioPaquete } from "@/components/paquetes/precio-paquete";
import { GaleriaLightbox } from "@/components/shared/galeria-lightbox";
import type { Paquete } from "@/types";

export const metadata = { title: "Paquetes" };

export default async function PaquetesPage() {
  const res = await callBackend<Paquete[]>("/paquetes", { revalidate: 60 });
  const paquetes = res.ok ? res.data : [];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
      <h1 className="font-display text-3xl font-semibold text-ink-900 mb-8">Todos los paquetes</h1>

      {paquetes.length === 0 ? (
        <p className="text-ink-400">No hay paquetes disponibles por ahora.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paquetes.map((p) => (
            <Card key={p.id} className="overflow-hidden flex flex-col gap-3 p-0">
              <GaleriaLightbox imagenes={p.imagenes} imagenPrincipal={p.imagenPrincipal} nombre={p.nombre}>
                <div className="relative h-40 bg-sun-100">
                  {p.imagenPrincipal && (
                    <ImagenSegura src={p.imagenPrincipal} alt={p.nombre} fill className="object-cover" />
                  )}
                </div>
              </GaleriaLightbox>
              <div className="px-5 pb-5 flex flex-col gap-3 flex-1">
                <h3 className="font-display text-lg font-semibold text-ink-900">{p.nombre}</h3>
                <p className="text-sm text-ink-600 line-clamp-3">{p.descripcion}</p>
                <div className="flex items-center gap-1.5 text-xs text-ink-400">
                  <CalendarDays className="size-3.5" />
                  {p.fechaInicio} — {p.fechaFin}
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <PrecioPaquete precio={p.precio} precioAnterior={p.precioAnterior} />
                  <span className="text-xs text-ink-400">{p.cupos} cupos</span>
                </div>
                <PaqueteAcciones paqueteId={p.id} paqueteNombre={p.nombre} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
