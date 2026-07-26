"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Mail, Phone, MapPin, CheckCheck, Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Proveedor } from "@/types";

export default function AdminProveedoresPage() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<"no-leidos" | "todos">("no-leidos");

  const { data: proveedores, isLoading } = useQuery({
    queryKey: ["admin-proveedores"],
    queryFn: () => apiFetch<Proveedor[]>("/proveedores"),
    refetchInterval: 20_000,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, leido }: { id: number; leido: boolean }) =>
      apiFetch<Proveedor>(`/proveedores/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ leido }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-proveedores"] });
      queryClient.invalidateQueries({ queryKey: ["proveedores-no-leidos-count"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar");
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/proveedores/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Registro eliminado");
      queryClient.invalidateQueries({ queryKey: ["admin-proveedores"] });
      queryClient.invalidateQueries({ queryKey: ["proveedores-no-leidos-count"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar");
    },
  });

  const listaFiltrada = useMemo(() => {
    if (!proveedores) return [];
    return filtro === "no-leidos" ? proveedores.filter((p) => !p.leido) : proveedores;
  }, [proveedores, filtro]);

  const noLeidos = proveedores?.filter((p) => !p.leido).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Proveedores</h1>
        <p className="text-sm text-ink-600">
          Negocios y posibles proveedores que dejaron sus datos desde el botón &quot;Contacto
          proveedores&quot; del sitio. Cada registro nuevo también se avisa por correo y por
          WhatsApp.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filtro === "no-leidos" ? "primary" : "ghost"}
          onClick={() => setFiltro("no-leidos")}
        >
          No leídos {noLeidos > 0 && `(${noLeidos})`}
        </Button>
        <Button
          size="sm"
          variant={filtro === "todos" ? "primary" : "ghost"}
          onClick={() => setFiltro("todos")}
        >
          Todos
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-card bg-sun-100/60 animate-pulse" />
          ))}
        </div>
      ) : listaFiltrada.length === 0 ? (
        <Card className="p-8 text-center text-sm text-ink-400">
          {filtro === "no-leidos"
            ? "No hay proveedores nuevos sin revisar."
            : "Todavía no se ha registrado ningún proveedor."}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {listaFiltrada.map((p) => (
            <Card key={p.id} className={`p-5 ${!p.leido ? "border-clay-300" : ""}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-sun-100 text-clay-600 flex items-center justify-center shrink-0">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-ink-900">
                      {p.nombreNegocio}
                      {!p.leido && (
                        <span className="ml-2 text-xs font-semibold text-clay-600 bg-clay-500/10 px-2 py-0.5 rounded-full">
                          Nuevo
                        </span>
                      )}
                    </p>
                    {p.rubro && <p className="text-xs text-ink-400">{p.rubro}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!p.leido && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actualizar.isPending}
                      onClick={() => actualizar.mutate({ id: p.id, leido: true })}
                    >
                      <CheckCheck className="size-4" />
                      Marcar leído
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={eliminar.isPending}
                    onClick={() => eliminar.mutate(p.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid sm:grid-cols-3 gap-2 text-sm text-ink-600">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-ink-400" /> {p.correo}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5 text-ink-400" /> {p.telefono}
                </span>
                {p.direccion && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-ink-400" /> {p.direccion}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-ink-800">{p.descripcion}</p>
              <p className="mt-2 text-xs text-ink-400">
                Contacto: {p.nombreContacto} · {new Date(p.createdAt).toLocaleString("es-CL")}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
