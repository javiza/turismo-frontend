"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, ShieldCheck, UserRound, UserCheck, UserX } from "lucide-react";

import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminUser, Cliente } from "@/types";

type Tab = "clientes" | "equipo";

export default function AdminUsuariosPage() {
  const [tab, setTab] = useState<Tab>("clientes");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");

  // Debounce simple: evita disparar una consulta por cada tecla mientras
  // el admin escribe el nombre/RUT que está buscando.
  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda.trim()), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Usuarios</h1>
        <p className="text-sm text-ink-600">
          Clientes registrados en el sitio y cuentas internas del equipo. Busca por nombre, email
          o RUT.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={tab === "clientes" ? "primary" : "ghost"}
            onClick={() => setTab("clientes")}
          >
            <UserRound className="size-4" />
            Clientes
          </Button>
          <Button
            size="sm"
            variant={tab === "equipo" ? "primary" : "ghost"}
            onClick={() => setTab("equipo")}
          >
            <ShieldCheck className="size-4" />
            Equipo interno
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-300" />
          <Input
            placeholder="Buscar por nombre, email o RUT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {tab === "clientes" ? (
        <TablaClientes q={busquedaDebounced} />
      ) : (
        <TablaEquipo q={busquedaDebounced} />
      )}
    </div>
  );
}

function TablaClientes({ q }: { q: string }) {
  const queryClient = useQueryClient();

  const { data: clientes, isLoading } = useQuery({
    queryKey: ["admin-clientes", q],
    queryFn: () =>
      apiFetch<Cliente[]>(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });

  const toggleActivo = useMutation({
    mutationFn: ({ id, activar }: { id: number; activar: boolean }) =>
      apiFetch<Cliente>(`/clientes/${id}/${activar ? "reactivate" : "deactivate"}`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      toast.success("Cliente actualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-clientes"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el cliente");
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-card bg-sun-100/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!clientes || clientes.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-12 text-center text-ink-400 text-sm">
        {q ? "No hay clientes que coincidan con la búsqueda." : "Todavía no hay clientes registrados."}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-sun-50 text-left text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">RUT</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sun-100">
            {clientes.map((c) => (
              <tr key={c.id} className="hover:bg-sun-50/50">
                <td className="px-4 py-3 font-medium text-ink-900">{c.nombre}</td>
                <td className="px-4 py-3 text-ink-600">{c.email}</td>
                <td className="px-4 py-3 text-ink-600">{c.rut || "—"}</td>
                <td className="px-4 py-3 text-ink-600">{c.telefono || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      c.activo ? "bg-emerald-500/15 text-emerald-700" : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {c.activo ? "Activo" : "Deshabilitado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={toggleActivo.isPending}
                    onClick={() => toggleActivo.mutate({ id: c.id, activar: !c.activo })}
                  >
                    {c.activo ? (
                      <>
                        <UserX className="size-4" />
                        Deshabilitar
                      </>
                    ) : (
                      <>
                        <UserCheck className="size-4" />
                        Reactivar
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TablaEquipo({ q }: { q: string }) {
  const queryClient = useQueryClient();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["admin-usuarios-equipo", q],
    queryFn: () =>
      apiFetch<AdminUser[]>(`/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });

  const toggleActivo = useMutation({
    mutationFn: ({ id, activar }: { id: number; activar: boolean }) =>
      apiFetch<AdminUser>(`/users/${id}/${activar ? "reactivate" : "deactivate"}`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      toast.success("Cuenta actualizada");
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios-equipo"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar la cuenta");
    },
  });

  const ordenados = useMemo(
    () => (usuarios ? [...usuarios].sort((a, b) => a.nombre.localeCompare(b.nombre)) : []),
    [usuarios],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-card bg-sun-100/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (ordenados.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-12 text-center text-ink-400 text-sm">
        {q ? "No hay cuentas que coincidan con la búsqueda." : "No hay cuentas internas cargadas."}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-sun-50 text-left text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">RUT</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sun-100">
            {ordenados.map((u) => (
              <tr key={u.id} className="hover:bg-sun-50/50">
                <td className="px-4 py-3 font-medium text-ink-900">{u.nombre}</td>
                <td className="px-4 py-3 text-ink-600">{u.email}</td>
                <td className="px-4 py-3 text-ink-600">{u.rut || "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-clay-500/15 text-clay-700">
                    {u.rol === "SUPER_ADMIN" ? "Super admin" : "Admin"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      u.activo ? "bg-emerald-500/15 text-emerald-700" : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {u.activo ? "Activo" : "Deshabilitado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={toggleActivo.isPending}
                    onClick={() => toggleActivo.mutate({ id: u.id, activar: !u.activo })}
                  >
                    {u.activo ? (
                      <>
                        <UserX className="size-4" />
                        Deshabilitar
                      </>
                    ) : (
                      <>
                        <UserCheck className="size-4" />
                        Reactivar
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
