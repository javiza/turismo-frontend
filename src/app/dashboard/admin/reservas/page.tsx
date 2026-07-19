"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarCheck, Pencil, Trash2, X, UserCheck, UserRound } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { EstadoReserva, Reserva } from "@/types";

const ESTADOS: EstadoReserva[] = ["PENDIENTE", "CONFIRMADA", "CANCELADA"];

const ESTADO_STYLES: Record<EstadoReserva, string> = {
  PENDIENTE: "bg-sun-200 text-ink-800",
  CONFIRMADA: "bg-success/15 text-success",
  CANCELADA: "bg-danger/15 text-danger",
};

const schema = z.object({
  nombreCliente: z.string().min(1, "Requerido").max(150),
  emailCliente: z
    .string()
    .email("Email inválido")
    .max(150)
    .optional()
    .or(z.literal("")),
  telefono: z.string().max(50).optional().or(z.literal("")),
  cantidadPersonas: z.coerce.number().int().min(1, "Mínimo 1"),
  montoTotal: z.coerce.number().min(0, "No puede ser negativo"),
  estado: z.enum(["PENDIENTE", "CONFIRMADA", "CANCELADA"]),
});

type FormValues = z.infer<typeof schema>;

export default function AdminReservasPage() {
  const queryClient = useQueryClient();
  const [filtroEstado, setFiltroEstado] = useState<EstadoReserva | "TODAS">("TODAS");
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<Reserva | null>(null);
  const [eliminando, setEliminando] = useState<Reserva | null>(null);

  const { data: reservas, isLoading } = useQuery({
    queryKey: ["admin-reservas"],
    queryFn: () => apiFetch<Reserva[]>("/reservas"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const abrirEdicion = (r: Reserva) => {
    setEditando(r);
    reset({
      nombreCliente: r.nombreCliente,
      emailCliente: r.emailCliente ?? "",
      telefono: r.telefono ?? "",
      cantidadPersonas: r.cantidadPersonas,
      montoTotal: r.montoTotal ?? 0,
      estado: r.estado,
    });
  };

  const cerrarEdicion = () => {
    setEditando(null);
    reset();
  };

  const actualizar = useMutation({
    mutationFn: ({ id, values }: { id: number; values: FormValues }) =>
      apiFetch<Reserva>(`/reservas/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...values,
          emailCliente: values.emailCliente || undefined,
          telefono: values.telefono || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success("Reserva actualizada");
      cerrarEdicion();
      queryClient.invalidateQueries({ queryKey: ["admin-reservas"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar la reserva");
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/reservas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Reserva eliminada");
      setEliminando(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reservas"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar la reserva");
    },
  });

  const reservasFiltradas = useMemo(() => {
    if (!reservas) return [];
    const q = busqueda.trim().toLowerCase();
    return reservas.filter((r) => {
      const coincideEstado = filtroEstado === "TODAS" || r.estado === filtroEstado;
      const coincideBusqueda =
        !q ||
        r.nombreCliente.toLowerCase().includes(q) ||
        r.emailCliente?.toLowerCase().includes(q) ||
        r.cliente?.email?.toLowerCase().includes(q) ||
        r.paquete?.nombre?.toLowerCase().includes(q);
      return coincideEstado && coincideBusqueda;
    });
  }, [reservas, filtroEstado, busqueda]);

  const totales = useMemo(() => {
    const base = { PENDIENTE: 0, CONFIRMADA: 0, CANCELADA: 0, monto: 0 };
    for (const r of reservas ?? []) {
      base[r.estado] += 1;
      if (r.estado !== "CANCELADA") base.monto += r.montoTotal ?? 0;
    }
    return base;
  }, [reservas]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Reservas</h1>
        <p className="text-sm text-ink-600">
          Todas las reservas hechas por los clientes, con el paquete y los datos de quien
          reservó. Edítalas o elimínalas si es necesario.
        </p>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-ink-400">Pendientes</p>
          <p className="text-xl font-semibold text-ink-900">{totales.PENDIENTE}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-400">Confirmadas</p>
          <p className="text-xl font-semibold text-ink-900">{totales.CONFIRMADA}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-400">Canceladas</p>
          <p className="text-xl font-semibold text-ink-900">{totales.CANCELADA}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-400">Monto activo</p>
          <p className="text-xl font-semibold text-ink-900">
            ${totales.monto.toLocaleString("es-CL")}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por cliente, email o paquete..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as EstadoReserva | "TODAS")}
          className="max-w-[180px]"
        >
          <option value="TODAS">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
      </div>

      {editando && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Editando reserva #{editando.id}
            </h2>
            <Button size="sm" variant="ghost" onClick={cerrarEdicion} aria-label="Cerrar">
              <X className="size-4" />
            </Button>
          </div>
          <form
            onSubmit={handleSubmit((values) =>
              actualizar.mutate({ id: editando.id, values }),
            )}
            className="grid sm:grid-cols-2 gap-4"
          >
            <Input
              label="Nombre del cliente"
              error={errors.nombreCliente?.message}
              {...register("nombreCliente")}
            />
            <Input
              label="Email"
              error={errors.emailCliente?.message}
              {...register("emailCliente")}
            />
            <Input label="Teléfono" error={errors.telefono?.message} {...register("telefono")} />
            <Input
              label="Cantidad de personas"
              type="number"
              min={1}
              error={errors.cantidadPersonas?.message}
              {...register("cantidadPersonas")}
            />
            <Input
              label="Monto total"
              type="number"
              min={0}
              step="0.01"
              error={errors.montoTotal?.message}
              {...register("montoTotal")}
            />
            <Select label="Estado" error={errors.estado?.message} {...register("estado")}>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={actualizar.isPending}>
                {actualizar.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button type="button" variant="ghost" onClick={cerrarEdicion}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {eliminando && (
        <Card className="p-6 border border-danger/30">
          <p className="text-sm text-ink-800 mb-4">
            ¿Eliminar definitivamente la reserva de{" "}
            <span className="font-medium">{eliminando.nombreCliente}</span> (#{eliminando.id})?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              disabled={eliminar.isPending}
              onClick={() => eliminar.mutate(eliminando.id)}
            >
              {eliminar.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
            <Button variant="ghost" onClick={() => setEliminando(null)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-card bg-sun-100/60 animate-pulse" />
          ))}
        </div>
      ) : reservasFiltradas.length === 0 ? (
        <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-12 text-center text-ink-400 text-sm">
          No hay reservas que coincidan con el filtro.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reservasFiltradas.map((r) => (
            <Card key={r.id} className="p-4 flex items-center gap-4 flex-wrap">
              <div className="size-9 rounded-full bg-sun-100 text-clay-600 flex items-center justify-center shrink-0">
                <CalendarCheck className="size-4" />
              </div>
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-ink-900 truncate">{r.nombreCliente}</p>
                  {r.cliente ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-clay-500/10 text-clay-600 shrink-0"
                      title="Reservó con su cuenta de cliente"
                    >
                      <UserCheck className="size-3" />
                      Cuenta
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-ink-100 text-ink-400 shrink-0"
                      title="Reservó como invitado, sin cuenta"
                    >
                      <UserRound className="size-3" />
                      Invitado
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-400 truncate">
                  {r.emailCliente ?? r.cliente?.email ?? "Sin email"}
                  {r.telefono ? ` · ${r.telefono}` : ""}
                </p>
                <p className="text-xs text-ink-400 truncate">
                  {r.paquete?.nombre ?? `Paquete #${r.paqueteId}`}
                  {r.paquete?.destino ? ` · ${r.paquete.destino.ciudad}, ${r.paquete.destino.pais}` : ""}
                  {" · "}
                  {r.cantidadPersonas} pers. · {new Date(r.fechaReserva).toLocaleDateString("es-CL")}
                </p>
              </div>
              <div className="text-sm text-ink-700 shrink-0">
                {r.montoTotal != null ? `$${r.montoTotal.toLocaleString("es-CL")}` : "—"}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full shrink-0 ${ESTADO_STYLES[r.estado]}`}
              >
                {r.estado}
              </span>
              <Button size="sm" variant="ghost" onClick={() => abrirEdicion(r)} aria-label="Editar">
                <Pencil className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEliminando(r)}
                aria-label="Eliminar"
              >
                <Trash2 className="size-4 text-danger" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
