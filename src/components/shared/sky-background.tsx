/**
 * Fondo decorativo tipo "cielo despejado": degradado suave de azul claro a
 * blanco, un sol sobrio (círculo con degradado y rayos finos, sin rostro)
 * y nubes translúcidas flotando muy sutilmente. Reemplaza al antiguo
 * TropicalScene, que dibujaba un sol con carita feliz y olas — quedaba
 * demasiado infantil para un sitio de reservas. Puramente visual
 * (aria-hidden, pointer-events-none), no interfiere con el contenido ni
 * con lectores de pantalla.
 *
 * Se posiciona con `absolute inset-0` por defecto: el contenedor que lo use
 * debe tener `relative` (o pasar `fixed inset-0` por className para que
 * cubra todo el viewport, como en el dashboard de cliente).
 */
const SUN_RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" className={className} fill="white" aria-hidden="true">
      <ellipse cx="60" cy="60" rx="50" ry="28" />
      <ellipse cx="110" cy="45" rx="42" ry="32" />
      <ellipse cx="150" cy="62" rx="38" ry="24" />
      <ellipse cx="90" cy="68" rx="58" ry="22" />
    </svg>
  );
}

export function SkyBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className ?? ""}`}
    >
      {/* Cielo: degradado de blanco (arriba, por la luminosidad del sol) a
          celeste (abajo), como el cielo real más claro cerca del sol y más
          azul hacia el horizonte inferior. */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, white 0%, var(--color-cream) 35%, var(--color-ocean-100) 100%)",
        }}
      />

      {/* Sol — círculo con degradado y rayos finos, sin rostro */}
      <div className="absolute -top-10 right-8 sm:right-24 w-40 h-40 sm:w-52 sm:h-52 animate-sun-glow-slow">
        <div className="absolute inset-0 rounded-full bg-sun-200/40 blur-2xl" />
        <svg viewBox="0 0 100 100" className="relative w-full h-full">
          <g stroke="var(--color-sun-300)" strokeWidth="2" strokeLinecap="round" opacity="0.5">
            {SUN_RAY_ANGLES.map((deg) => (
              <line key={deg} x1="50" y1="6" x2="50" y2="14" transform={`rotate(${deg} 50 50)`} />
            ))}
          </g>
          <circle cx="50" cy="50" r="26" fill="var(--color-sun-100)" />
          <circle cx="50" cy="50" r="26" fill="url(#sun-shading)" />
          <defs>
            <radialGradient id="sun-shading" cx="38%" cy="35%" r="70%">
              <stop offset="0%" stopColor="var(--color-sun-100)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--color-sun-300)" stopOpacity="0.55" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Nubes translúcidas, muy sutiles */}
      <Cloud className="absolute top-[8%] left-[4%] w-40 sm:w-56 opacity-35 animate-cloud-drift" />
      <Cloud className="absolute top-[20%] left-[40%] w-32 sm:w-48 opacity-25 animate-cloud-drift-slow" />
      <Cloud className="absolute top-[4%] left-[68%] w-28 sm:w-40 opacity-20 animate-cloud-drift" />
    </div>
  );
}
