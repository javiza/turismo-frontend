"use client";

import { useQuery } from "@tanstack/react-query";
import { Newspaper } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { ImagenSegura } from "@/components/shared/imagen-segura";
import { NoticiaConsultaBoton } from "@/components/noticias/noticia-consulta-boton";
import type { Noticia } from "@/types";

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function NoticiasClientePage() {
  const { data: noticias, isLoading } = useQuery({
    queryKey: ["noticias"],
    queryFn: () => apiFetch<Noticia[]>("/noticias"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Noticias</h1>
        <p className="text-sm text-ink-600">Novedades de nuestra agencia.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-card bg-sun-100/60 animate-pulse" />
          ))}
        </div>
      ) : !noticias || noticias.length === 0 ? (
        <Card className="p-8 text-center text-ink-400 text-sm">
          Todavía no hay noticias publicadas.
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {noticias.map((n) => (
            <Card key={n.id} className="overflow-hidden flex flex-col sm:flex-row gap-0 p-0">
              {n.imagenUrl && (
                <div className="relative h-40 sm:h-auto sm:w-52 shrink-0 bg-sun-100">
                  <ImagenSegura src={n.imagenUrl} alt={n.titulo} fill className="object-cover" />
                </div>
              )}
              <div className="p-5 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs text-clay-600 font-medium">
                  <Newspaper className="size-3.5" />
                  {formatearFecha(n.createdAt)}
                </div>
                <h3 className="font-display text-lg font-semibold text-ink-900">{n.titulo}</h3>
                <p className="text-sm text-ink-600 whitespace-pre-line">{n.contenido}</p>
                <div className="mt-2">
                  <NoticiaConsultaBoton noticiaId={n.id} noticiaTitulo={n.titulo} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
