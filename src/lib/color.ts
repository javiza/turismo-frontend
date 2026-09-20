const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function esHexValido(valor: string | null | undefined): valor is string {
  return typeof valor === "string" && HEX.test(valor);
}

/** true si el color es oscuro (luminancia percibida baja). Devuelve false si no es un hex válido. */
export function esColorOscuro(hex: string): boolean {
  if (!esHexValido(hex)) return false;
  const limpio = hex.replace("#", "");
  const full =
    limpio.length === 3
      ? limpio
          .split("")
          .map((c) => c + c)
          .join("")
      : limpio;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}
