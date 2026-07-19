interface PrecioPaqueteProps {
  precio: number;
  precioAnterior?: number;
  size?: "sm" | "lg";
}

/**
 * Muestra el precio de un paquete. Si tiene una rebaja vigente
 * (precioAnterior seteado por el admin al bajar el precio, ver
 * PaquetesService.update en el backend), pinta el precio viejo tachado
 * al lado del nuevo, como hacen las agencias comerciales.
 */
export function PrecioPaquete({ precio, precioAnterior, size = "lg" }: PrecioPaqueteProps) {
  const hayRebaja = precioAnterior != null && Number(precioAnterior) > Number(precio);
  const textoActual = size === "lg" ? "text-xl" : "text-base";
  const textoAnterior = size === "lg" ? "text-sm" : "text-xs";

  if (!hayRebaja) {
    return (
      <span className={`font-display ${textoActual} font-semibold text-clay-600`}>
        ${Number(precio).toLocaleString("es-CL")}
      </span>
    );
  }

  const porcentaje = Math.round((1 - Number(precio) / Number(precioAnterior)) * 100);

  return (
    <span className="flex items-baseline gap-2 flex-wrap">
      <span className={`text-ink-300 line-through ${textoAnterior}`}>
        ${Number(precioAnterior).toLocaleString("es-CL")}
      </span>
      <span className={`font-display ${textoActual} font-semibold text-clay-600`}>
        ${Number(precio).toLocaleString("es-CL")}
      </span>
      <span className="text-xs font-medium text-success bg-success/15 px-1.5 py-0.5 rounded-full">
        -{porcentaje}%
      </span>
    </span>
  );
}
