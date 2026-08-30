"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette, X } from "lucide-react";

/** Favoritos: tonos ya usados en el diseño del sitio + algunos extras
 * neutros/oscuros para navbars con mayor contraste. Se muestran siempre,
 * como acceso rápido antes de abrir la paleta completa. */
export const PALETA_SUGERIDA = [
  { nombre: "Celeste (por defecto)", valor: "#f8fbff" },
  { nombre: "Blanco", valor: "#ffffff" },
  { nombre: "Celeste suave", valor: "#e8f3ff" },
  { nombre: "Azul pastel", valor: "#dbe4f5" },
  { nombre: "Crema cálido", valor: "#fdf6ec" },
  { nombre: "Arena", valor: "#f5f1e8" },
  { nombre: "Azul marino", valor: "#142c4c" },
  { nombre: "Tinta", valor: "#1b2230" },
];

/** Paleta completa, agrupada por familia de color (estilo escala 50→900
 * de Tailwind) para que el admin pueda elegir un tono específico dentro
 * de cada gama en vez de depender solo del selector nativo. */
const FAMILIAS_COLOR: { nombre: string; tonos: string[] }[] = [
  {
    nombre: "Naranjos",
    tonos: [
      "#fff7ed", "#ffedd5", "#fed7aa", "#fdba74", "#fb923c",
      "#f97316", "#ea580c", "#c2410c", "#9a3412", "#7c2d12",
    ],
  },
  {
    nombre: "Rojos",
    tonos: [
      "#fef2f2", "#fee2e2", "#fecaca", "#fca5a5", "#f87171",
      "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d",
    ],
  },
  {
    nombre: "Rosados",
    tonos: [
      "#fdf2f8", "#fce7f3", "#fbcfe8", "#f9a8d4", "#f472b6",
      "#ec4899", "#db2777", "#be185d", "#9d174d", "#831843",
    ],
  },
  {
    nombre: "Verdes",
    tonos: [
      "#f0fdf4", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80",
      "#22c55e", "#16a34a", "#15803d", "#166534", "#14532d",
    ],
  },
  {
    nombre: "Azules",
    tonos: [
      "#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa",
      "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a",
    ],
  },
  {
    nombre: "Grises",
    tonos: [
      "#ffffff", "#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db",
      "#9ca3af", "#6b7280", "#4b5563", "#374151", "#1f2937",
      "#111827", "#000000",
    ],
  },
];

/** true si el color de fondo es oscuro, para pintar el check en blanco. */
function esOscuro(hex: string): boolean {
  const limpio = hex.replace("#", "");
  const full = limpio.length === 3 ? limpio.split("").map((c) => c + c).join("") : limpio;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Percepción de luminancia (fórmula estándar).
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

function Swatch({
  valor,
  nombre,
  seleccionado,
  onClick,
  size = "size-8",
}: {
  valor: string;
  nombre: string;
  seleccionado: boolean;
  onClick: () => void;
  size?: string;
}) {
  return (
    <button
      type="button"
      title={nombre}
      aria-label={nombre}
      onClick={onClick}
      className={`${size} shrink-0 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${
        seleccionado ? "border-clay-500" : "border-sun-200"
      }`}
      style={{ backgroundColor: valor }}
    >
      {seleccionado && (
        <Check
          className="size-3.5"
          style={{ color: esOscuro(valor) ? "#fff" : "#1b2230" }}
        />
      )}
    </button>
  );
}

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
  const [abierta, setAbierta] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);

  const esHexValido = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
  const valorNormalizado = value.toLowerCase();

  // Cierra la paleta emergente al hacer click afuera o al presionar Escape.
  useEffect(() => {
    if (!abierta) return;

    function alClickearAfuera(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !botonRef.current?.contains(e.target as Node)
      ) {
        setAbierta(false);
      }
    }
    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierta(false);
    }

    document.addEventListener("mousedown", alClickearAfuera);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("mousedown", alClickearAfuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierta]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-800">{label}</span>
      {descripcion && <p className="text-xs text-ink-400 -mt-1">{descripcion}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {PALETA_SUGERIDA.map((color) => (
          <Swatch
            key={color.valor}
            valor={color.valor}
            nombre={color.nombre}
            seleccionado={valorNormalizado === color.valor.toLowerCase()}
            onClick={() => onChange(color.valor)}
          />
        ))}

        <div className="relative">
          <button
            ref={botonRef}
            type="button"
            onClick={() => setAbierta((v) => !v)}
            aria-expanded={abierta}
            title="Ver más colores"
            className={`size-8 shrink-0 rounded-full border-2 border-dashed flex items-center justify-center transition-transform hover:scale-110 text-ink-400 hover:text-clay-600 ${
              abierta ? "border-clay-500 text-clay-600" : "border-sun-300"
            }`}
          >
            <Palette className="size-3.5" />
          </button>

          {abierta && (
            <div
              ref={popoverRef}
              className="absolute z-50 top-10 left-0 w-72 max-h-80 overflow-y-auto rounded-xl border border-sun-200 bg-white p-3 shadow-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-800">Paleta completa</span>
                <button
                  type="button"
                  onClick={() => setAbierta(false)}
                  className="text-ink-400 hover:text-clay-600"
                  aria-label="Cerrar paleta"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {FAMILIAS_COLOR.map((familia) => (
                  <div key={familia.nombre}>
                    <p className="text-[11px] font-medium text-ink-400 mb-1">{familia.nombre}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {familia.tonos.map((tono) => (
                        <Swatch
                          key={tono}
                          valor={tono}
                          nombre={tono}
                          seleccionado={valorNormalizado === tono.toLowerCase()}
                          onClick={() => onChange(tono)}
                          size="size-6"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
