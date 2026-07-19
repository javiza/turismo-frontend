import { Compass } from "lucide-react";

export function Footer({ nombreAgencia = "Tu Agencia de Viajes" }: { nombreAgencia?: string }) {
  return (
    <footer className="border-t border-sun-100 bg-white/60 mt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-600">
        <div className="flex items-center gap-2 font-display text-clay-600">
          <Compass className="size-5" strokeWidth={1.75} />
          {nombreAgencia}
        </div>
        <p>© {new Date().getFullYear()} {nombreAgencia}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
