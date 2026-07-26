/**
 * Fondo decorativo animado estilo "dibujo animado": sol con carita feliz
 * arriba a la derecha, nubes traslucidas flotando en el centro y olas
 * animadas abajo. Puramente visual (aria-hidden, pointer-events-none), así
 * que no interfiere con el contenido ni con lectores de pantalla.
 *
 * Se posiciona con `absolute inset-0` por defecto: el contenedor que lo use
 * debe tener `relative` (o pasar `fixed inset-0` por className para que
 * cubra todo el viewport, como en el dashboard de cliente).
 */
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

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function TropicalScene({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className ?? ""}`}
    >
      {/* Sol con carita feliz — arriba a la derecha */}
      <div className="absolute -top-3 right-4 sm:-top-6 sm:right-12 w-24 h-24 sm:w-36 sm:h-36 animate-sun-bob">
        <div className="absolute inset-0 rounded-full bg-sun-300/60 blur-2xl animate-sun-glow" />
        <svg viewBox="0 0 100 100" className="relative w-full h-full">
          <g stroke="var(--color-sun-400)" strokeWidth="4" strokeLinecap="round" opacity="0.75">
            {RAY_ANGLES.map((deg) => (
              <line
                key={deg}
                x1="50"
                y1="4"
                x2="50"
                y2="16"
                transform={`rotate(${deg} 50 50)`}
              />
            ))}
          </g>
          <circle cx="50" cy="50" r="28" fill="var(--color-sun-300)" />
          <circle cx="50" cy="50" r="28" fill="var(--color-sun-200)" opacity="0.35" />
          {/* carita feliz */}
          <circle cx="40" cy="45" r="3.2" fill="var(--color-clay-700)" />
          <circle cx="60" cy="45" r="3.2" fill="var(--color-clay-700)" />
          <path
            d="M38 57 Q50 68 62 57"
            stroke="var(--color-clay-700)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="30" cy="53" r="3" fill="var(--color-clay-300)" opacity="0.6" />
          <circle cx="70" cy="53" r="3" fill="var(--color-clay-300)" opacity="0.6" />
        </svg>
      </div>

      {/* Nubes traslucidas — en el centro */}
      <Cloud className="absolute top-[14%] left-[6%] w-40 sm:w-56 opacity-50 animate-cloud-drift" />
      <Cloud className="absolute top-[26%] left-[38%] w-32 sm:w-44 opacity-40 animate-cloud-drift-slow" />
      <Cloud className="absolute top-[10%] left-[66%] w-28 sm:w-40 opacity-30 animate-cloud-drift" />

      {/* Olas — abajo */}
      <div className="absolute bottom-0 left-0 w-full leading-none">
        <svg
          viewBox="0 0 2400 120"
          preserveAspectRatio="none"
          className="w-[200%] h-14 sm:h-24 animate-wave-scroll"
        >
          <path
            d="M0,60 C150,110 350,10 600,60 C850,110 1050,10 1200,60 C1350,110 1550,10 1800,60 C1950,110 2150,10 2400,60 L2400,120 L0,120 Z"
            fill="var(--color-ocean-200)"
            opacity="0.55"
          />
        </svg>
        <svg
          viewBox="0 0 2400 120"
          preserveAspectRatio="none"
          className="w-[200%] h-14 sm:h-24 -mt-8 sm:-mt-14 animate-wave-scroll-reverse"
        >
          <path
            d="M0,70 C200,20 400,110 600,70 C800,30 1000,100 1200,70 C1400,20 1600,110 1800,70 C2000,30 2200,100 2400,70 L2400,120 L0,120 Z"
            fill="var(--color-ocean-300)"
            opacity="0.65"
          />
        </svg>
      </div>
    </div>
  );
}
