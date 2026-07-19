import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Percent, CalendarDays, Compass, Eye, Heart, Star } from "lucide-react";
import { callBackend } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaqueteAcciones } from "@/components/paquetes/paquete-acciones";
import { PrecioPaquete } from "@/components/paquetes/precio-paquete";
import { DestinoAcciones } from "@/components/destinos/destino-acciones";
import type { Destino, Paquete, Oferta, ContenidoHome } from "@/types";

async function getHomeData() {
  const [destinos, paquetes, ofertas, contenido] = await Promise.all([
    callBackend<Destino[]>("/destinos"),
    callBackend<Paquete[]>("/paquetes"),
    callBackend<Oferta[]>("/ofertas"),
    callBackend<ContenidoHome>("/contenido-home"),
  ]);

  return {
    destinos: destinos.ok ? destinos.data.slice(0, 3) : [],
    paquetes: paquetes.ok ? paquetes.data.slice(0, 3) : [],
    ofertas: ofertas.ok ? ofertas.data.slice(0, 2) : [],
    contenido: contenido.ok ? contenido.data : null,
  };
}

export default async function HomePage() {
  const { destinos, paquetes, ofertas, contenido } = await getHomeData();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at top left, var(--color-sun-100), transparent 60%), radial-gradient(ellipse at bottom right, var(--color-clay-100), transparent 55%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <span className="inline-flex items-center gap-2 rounded-full bg-sun-200/70 text-clay-700 text-xs font-medium px-3 py-1 mb-6">
            Nuevas rutas cada temporada
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold text-ink-900 max-w-2xl leading-[1.05]">
            {contenido?.titulo || "Programa tus vacaciones con nosotros"}
          </h1>
          <p className="mt-6 text-lg text-ink-600 max-w-xl">
            {contenido?.subtitulo ||
              "Arma tu próximo viaje con destinos, paquetes y ofertas curadas por nuestro equipo — todo reservable en minutos."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/destinos">
              <Button size="lg">
                Explorar destinos <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/paquetes">
              <Button size="lg" variant="secondary">
                Ver paquetes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Destinos destacados */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
            Destinos destacados
          </h2>
          <Link href="/destinos" className="text-sm font-medium text-clay-600 hover:underline">
            Ver todos
          </Link>
        </div>

        {destinos.length === 0 ? (
          <EmptyState label="Todavía no hay destinos cargados." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinos.map((d) => (
              <Card key={d.id} className="overflow-hidden group">
                <div className="relative h-44 bg-sun-100">
                  {d.imagenPrincipal && (
                    <Image
                      src={d.imagenPrincipal}
                      alt={d.nombre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-clay-600 font-medium mb-1.5">
                    <MapPin className="size-3.5" />
                    {d.ciudad}, {d.pais}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-ink-900">{d.nombre}</h3>
                  <p className="mt-1.5 text-sm text-ink-600 line-clamp-2">{d.descripcion}</p>
                  <DestinoAcciones destinoId={d.id} destinoNombre={d.nombre} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Paquetes destacados */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
            Paquetes disponibles
          </h2>
          <Link href="/paquetes" className="text-sm font-medium text-clay-600 hover:underline">
            Ver todos
          </Link>
        </div>

        {paquetes.length === 0 ? (
          <EmptyState label="Todavía no hay paquetes publicados." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paquetes.map((p) => (
              <Card key={p.id} className="p-5 flex flex-col gap-3">
                <h3 className="font-display text-lg font-semibold text-ink-900">{p.nombre}</h3>
                <p className="text-sm text-ink-600 line-clamp-2">{p.descripcion}</p>
                <div className="flex items-center gap-1.5 text-xs text-ink-400">
                  <CalendarDays className="size-3.5" />
                  {p.fechaInicio} — {p.fechaFin}
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <PrecioPaquete precio={p.precio} precioAnterior={p.precioAnterior} />
                  <span className="text-xs text-ink-400">{p.cupos} cupos</span>
                </div>
                <PaqueteAcciones paqueteId={p.id} paqueteNombre={p.nombre} />
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Ofertas */}
      {ofertas.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 mb-8">
            Ofertas activas
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {ofertas.map((o) => (
              <Card
                key={o.id}
                className="p-6 flex flex-col gap-4 bg-gradient-to-br from-clay-50 to-sun-50"
              >
                <div className="flex items-center gap-4">
                  <div className="size-11 rounded-full bg-clay-500 text-white flex items-center justify-center shrink-0">
                    <Percent className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink-900">{o.titulo}</h3>
                    {o.descripcion && <p className="text-sm text-ink-600">{o.descripcion}</p>}
                    <p className="text-xs text-clay-600 font-medium mt-1">
                      {Number(o.descuento)}% de descuento
                    </p>
                  </div>
                </div>
                {o.paquete && (
                  <PaqueteAcciones paqueteId={o.paquete.id} paqueteNombre={o.paquete.nombre} />
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Quiénes somos: presentación, misión, visión y valores (editable desde el panel admin) */}
      {contenido &&
        (contenido.presentacion || contenido.mision || contenido.vision || contenido.valores) && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 mb-8">
              Quiénes somos
            </h2>

            {contenido.presentacion && (
              <p className="text-ink-600 max-w-3xl mb-10 leading-relaxed">{contenido.presentacion}</p>
            )}

            <div className="grid sm:grid-cols-3 gap-6">
              {contenido.mision && (
                <Card className="p-6">
                  <Compass className="size-6 text-clay-600 mb-3" />
                  <h3 className="font-display text-lg font-semibold text-ink-900 mb-1.5">Misión</h3>
                  <p className="text-sm text-ink-600 leading-relaxed">{contenido.mision}</p>
                </Card>
              )}
              {contenido.vision && (
                <Card className="p-6">
                  <Eye className="size-6 text-clay-600 mb-3" />
                  <h3 className="font-display text-lg font-semibold text-ink-900 mb-1.5">Visión</h3>
                  <p className="text-sm text-ink-600 leading-relaxed">{contenido.vision}</p>
                </Card>
              )}
              {contenido.valores && (
                <Card className="p-6">
                  <Heart className="size-6 text-clay-600 mb-3" />
                  <h3 className="font-display text-lg font-semibold text-ink-900 mb-1.5">Valores</h3>
                  <p className="text-sm text-ink-600 leading-relaxed">{contenido.valores}</p>
                </Card>
              )}
            </div>
          </section>
        )}

      {/* Reseñas de clientes (editable desde el panel admin) */}
      {contenido && contenido.resenas.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 mb-8">
            Lo que dicen nuestros clientes
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contenido.resenas.map((r, i) => (
              <Card key={i} className="p-6">
                {r.valoracion && (
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className={`size-4 ${
                          j < r.valoracion! ? "fill-sun-400 text-sun-400" : "text-ink-100"
                        }`}
                      />
                    ))}
                  </div>
                )}
                <p className="text-sm text-ink-600 leading-relaxed italic">&ldquo;{r.texto}&rdquo;</p>
                <p className="mt-3 text-sm font-medium text-ink-900">{r.nombre}</p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-16 text-center text-ink-400">
      {label}
    </div>
  );
}
