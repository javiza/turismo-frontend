"use client";

import { Check } from "lucide-react";

/** Paleta sugerida: tonos ya usados en el diseño del sitio + algunos
 * extras neutros/oscuros para navbars con mayor contraste. El admin
 * también puede elegir cualquier otro color con el selector nativo o
 * escribiendo el hex a mano. */
export const PALETA_SUGERIDA = [
  { nombre: "Celeste (por defecto)", valor: "#f8fbff" },
  { nombre: "Blanco", valor: "#ffffff" },
  { nombre: "Celeste suave", valor: "#e8f3ff" },
  { nombre: "Celeste medio", valor: "#d3e9ff" },
  { nombre: "Azul pastel", valor: "#dbe4f5" },
  { nombre: "Crema cálido", valor: "#fdf6ec" },
  { nombre: "Arena", valor: "#f5f1e8" },
  { nombre: "Piedra claro", valor: "#f5f5f4" },
  { nombre: "Azul marino", valor: "#142c4c" },
  { nombre: "Tinta", valor: "#1b2230" },
];

export function SelectorColor({
  label,
  value,
  onChange,
  descripcion,
}: {
  label: string;
  /** "" o undefined = sin personalizar (usa el valor por defecto del sitio). */
  value: string;
  onChange: (valor: string) => void;
  descripcion?: string;
}) {
  const esHexValido = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-800">{label}</span>
      {descripcion && <p className="text-xs text-ink-400 -mt-1">{descripcion}</p>}

      <div className="flex flex-wrap gap-2">
        {PALETA_SUGERIDA.map((color) => {
          const seleccionado = value.toLowerCase() === color.valor.toLowerCase();
          return (
            <button
              key={color.valor}
              type="button"
              title={color.nombre}
              aria-label={color.nombre}
              onClick={() => onChange(color.valor)}
              className={`size-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${
                seleccionado ? "border-clay-500" : "border-sun-200"
              }`}
              style={{ backgroundColor: color.valor }}
            >
              {seleccionado && (
                <Check
                  className="size-4"
                  style={{
                    color: ["#142c4c", "#1b2230"].includes(color.valor) ? "#fff" : "#1b2230",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <input
          type="color"
          value={esHexValido ? value : "#f8fbff"}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 rounded-lg border border-sun-200 cursor-pointer bg-white p-1"
          aria-label={`${label} (personalizado)`}
        />
        <input
          type="text"
          value={value}
          placeholder="#f8fbff"
          onChange={(e) => onChange(e.target.value)}
          className="w-28 rounded-lg border border-sun-200 bg-white px-2.5 py-1.5 text-sm text-ink-900"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-ink-400 hover:text-clay-600 underline underline-offset-2"
          >
            Restablecer al color por defecto
          </button>
        )}
      </div>
    </div>
  );
}
