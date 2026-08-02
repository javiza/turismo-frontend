import { Info } from "lucide-react";
import type { Destino } from "@/types";

interface IncluyeTourProps {
  destino?: Destino;
  fechaInicio: string;
  fechaFin: string;
}

function formatearFecha(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Texto automático que aclara qué es un paquete: un tour guiado en un
 * destino puntual, válido durante un rango de fechas fijo. Se arma solo
 * a partir de los datos del paquete (destino + fechaInicio/fechaFin),
 * el admin no tiene que escribir nada aparte.
 */
export function IncluyeTour({ destino, fechaInicio, fechaFin }: IncluyeTourProps) {
  if (!destino) return null;

  return (
    <p className="flex items-start gap-1.5 text-xs text-ink-500 leading-snug">
      <Info className="size-3.5 shrink-0 mt-0.5" />
      <span>
        Incluye tour guiado en {destino.nombre} ({destino.ciudad}, {destino.pais}) del{" "}
        {formatearFecha(fechaInicio)} al {formatearFecha(fechaFin)}.
      </span>
    </p>
  );
}
