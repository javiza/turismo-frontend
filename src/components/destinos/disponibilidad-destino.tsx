import { CalendarRange } from "lucide-react";

interface DisponibilidadDestinoProps {
  fechaInicio?: string;
  fechaFin?: string;
}

function formatearFecha(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Texto con el rango en que el destino está disponible como servicio.
 * Destinos creados antes de este campo pueden no tenerlo cargado, así
 * que no se muestra nada si falta alguna de las dos fechas.
 */
export function DisponibilidadDestino({ fechaInicio, fechaFin }: DisponibilidadDestinoProps) {
  if (!fechaInicio || !fechaFin) return null;

  return (
    <p className="flex items-center gap-1.5 text-xs text-ink-500">
      <CalendarRange className="size-3.5 shrink-0" />
      Disponible del {formatearFecha(fechaInicio)} al {formatearFecha(fechaFin)}
    </p>
  );
}
