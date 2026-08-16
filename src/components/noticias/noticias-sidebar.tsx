import { Newspaper } from "lucide-react";
import { NoticiaConsultaBoton } from "./noticia-consulta-boton";
import type { Noticia } from "@/types";

/**
 * Widget compacto de noticias para ir "a un costado" del contenido
 * principal (home público y home del cliente logueado), en vez de ser
 * su propia sección de ancho completo. A propósito solo muestra
 * título + descripción (sin imagen) para que quepa cómodo en una
 * columna angosta.
 */
export function NoticiasSidebar({
  noticias,
  titulo = "Últimas noticias",
}: {
  noticias: Noticia[];
  titulo?: string;
}) {
  if (noticias.length === 0) return null;

  return (
    <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
      <div className="flex items-center gap-2 text-ink-900">
        <Newspaper className="size-5 text-clay-600" />
        <h3 className="font-display text-lg font-semibold">{titulo}</h3>
      </div>
      <div className="flex flex-col gap-4">
        {noticias.map((n) => (
          <div key={n.id} className="border-b border-sun-200 pb-4 last:border-0 last:pb-0">
            <h4 className="font-display text-base font-semibold text-ink-900 mb-1">
              {n.titulo}
            </h4>
            <p className="text-sm text-ink-600 line-clamp-3">{n.contenido}</p>
            <div className="mt-2">
              <NoticiaConsultaBoton noticiaId={n.id} noticiaTitulo={n.titulo} />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
