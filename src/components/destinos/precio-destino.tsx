interface PrecioDestinoProps {
  precioDesde?: number;
  size?: "sm" | "lg";
}

/**
 * Muestra el precio referencial de un destino ("Desde $X"), cargado a
 * mano por el admin (ver Destino.precioDesde). Si no está cargado, no
 * renderiza nada — no todos los destinos tienen por qué mostrar precio.
 */
export function PrecioDestino({ precioDesde, size = "sm" }: PrecioDestinoProps) {
  if (precioDesde == null) return null;

  const texto = size === "lg" ? "text-lg" : "text-sm";

  return (
    <span className={`font-display ${texto} font-semibold text-clay-600`}>
      Desde ${Number(precioDesde).toLocaleString("es-CL")}
    </span>
  );
}
