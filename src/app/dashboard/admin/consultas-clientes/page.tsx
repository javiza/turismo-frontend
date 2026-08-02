"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCheck, MailOpen, MessageCircleReply, Send } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useConsultasNoLeidas } from "@/hooks/use-consultas-no-leidas";
import type { Cotizacion, EstadoCotizacion } from "@/types";

const ESTADO_STYLES: Record<EstadoCotizacion, string> = {
  PENDIENTE: "bg-sun-200 text-sun-800",
  RESPONDIDA: "bg-info/15 text-info",
  CERRADA: "bg-ink-100 text-ink-600",
};

export default function AdminConsultasClientesPage() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<"todas" | "no-leidas" | "pendientes">("no-leidas");
  const [abierta, setAbierta] = useState<number | null>(null);
  const [borradores, setBorradores] = useState<Record<number, string>>({});

  const { data: consultas, isLoading } = useQuery({
    queryKey: ["admin-cotizaciones"],
    queryFn: () => apiFetch<Cotizacion[]>("/cotizaciones"),
    refetchInterval: 20_000,
  });

  // Ticket de notificación visible: mientras esta página está abierta,
  // avisa con un toast si llega una consulta nueva (además del correo
  // que ya recibe el admin por fuera de la app).
  useConsultasNoLeidas({ avisar: true });

  const actualizar = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: { leida?: boolean; respuesta?: string; estado?: EstadoCotizacion };
    }) =>
      apiFetch<Cotizacion>(`/cotizaciones/${id}/admin`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) => {
      if (variables.body.respuesta) {
        toast.success("Respuesta enviada al cliente");
        setAbierta(null);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-cotizaciones"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar la consulta");
    },
  });

  const consultasFiltradas = useMemo(() => {
    if (!consultas) return [];
    if (filtro === "no-leidas") return consultas.filter((c) => !c.leida);
    if (filtro === "pendientes") return consultas.filter((c) => c.estado === "PENDIENTE");
    return consultas;
  }, [consultas, filtro]);

  const noLeidas = consultas?.filter((c) => !c.leida).length ?? 0;

  const enviarRespuesta = (id: number) => {
    const texto = borradores[id]?.trim();
    if (!texto) {
      toast.error("Escribe una respuesta antes de enviar");
      return;
    }
    actualizar.mutate({ id, body: { respuesta: texto } });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Consultas de clientes
        </h1>
        <p className="text-sm text-ink-600">
          Preguntas enviadas desde paquetes, destinos o el formulario general. Responde y la
          respuesta le llega al cliente por correo y en su panel.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filtro === "no-leidas" ? "primary" : "ghost"}
          onClick={() => setFiltro("no-leidas")}
        >
          No leídas {noLeidas > 0 && `(${noLeidas})`}
        </Button>
        <Button
          size="sm"
          variant={filtro === "pendientes" ? "primary" : "ghost"}
          onClick={() => setFiltro("pendientes")}
        >
          Sin responder
        </Button>
        <Button
          size="sm"
          variant={filtro === "todas" ? "primary" : "ghost"}
          onClick={() => setFiltro("todas")}
        >
          Todas
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-card bg-sun-100/60 animate-pulse" />
          ))}
        </div>
      ) : consultasFiltradas.length === 0 ? (
        <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-12 text-center text-ink-400 text-sm">
          No hay consultas para mostrar.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {consultasFiltradas.map((c) => {
            const referencia =
              c.paquete?.nombre ?? c.destino?.nombre ?? c.noticia?.titulo ?? "Consulta general";
            const abiertaAqui = abierta === c.id;

            return (
              <Card key={c.id} className={`p-4 ${!c.leida ? "border-l-4 border-l-clay-500" : ""}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-ink-900">{c.nombre}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${ESTADO_STYLES[c.estado]}`}
                      >
                        {c.estado}
                      </span>
                      {!c.leida && (
                        <span className="text-xs px-2 py-1 rounded-full bg-clay-500/15 text-clay-700">
                          No leída
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {c.email} {c.telefono ? `· ${c.telefono}` : ""} · {referencia} ·{" "}
                      {new Date(c.createdAt).toLocaleDateString("es-CL")}
                    </p>
                    <p className="text-sm text-ink-800 mt-2">{c.mensaje || "(sin mensaje)"}</p>

                    {c.respuesta && (
                      <div className="mt-3 rounded-lg bg-info/10 p-3">
                        <p className="text-xs font-medium text-info mb-1">Tu respuesta</p>
                        <p className="text-sm text-ink-800">{c.respuesta}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {!c.leida && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actualizar.isPending}
                        onClick={() => actualizar.mutate({ id: c.id, body: { leida: true } })}
                        aria-label="Marcar como leída"
                      >
                        <MailOpen className="size-4" />
                      </Button>
                    )}
                    {c.estado !== "CERRADA" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actualizar.isPending}
                        onClick={() =>
                          actualizar.mutate({ id: c.id, body: { estado: "CERRADA" } })
                        }
                        aria-label="Cerrar consulta"
                      >
                        <CheckCheck className="size-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={abiertaAqui ? "secondary" : "primary"}
                      onClick={() => setAbierta(abiertaAqui ? null : c.id)}
                    >
                      <MessageCircleReply className="size-4" />
                      {c.respuesta ? "Editar respuesta" : "Responder"}
                    </Button>
                  </div>
                </div>

                {abiertaAqui && (
                  <div className="mt-4 flex flex-col gap-2">
                    <Textarea
                      placeholder="Escribe tu respuesta para el cliente..."
                      defaultValue={c.respuesta ?? ""}
                      onChange={(e) =>
                        setBorradores((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={actualizar.isPending}
                        onClick={() => enviarRespuesta(c.id)}
                      >
                        <Send className="size-4" />
                        {actualizar.isPending ? "Enviando..." : "Enviar respuesta"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAbierta(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
