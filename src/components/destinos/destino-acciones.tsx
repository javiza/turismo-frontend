"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, CalendarCheck, MessageCircleQuestion } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSessionStore } from "@/store/session-store";
import { useRegistrarVisita } from "@/lib/use-registrar-visita";
import type { Paquete } from "@/types";

const consultaSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(150),
  email: z.string().email("Email inválido"),
  telefono: z.string().max(50).optional().or(z.literal("")),
  mensaje: z.string().min(1, "Escribe tu pregunta").max(2000),
});
type ConsultaValues = z.infer<typeof consultaSchema>;

const reservaSchema = z.object({
  paqueteId: z.coerce.number().int().positive("Elige un paquete"),
  nombreCliente: z.string().min(1, "Requerido").max(150),
  emailCliente: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().max(50).optional().or(z.literal("")),
  cantidadPersonas: z.coerce.number().int().min(1, "Mínimo 1 persona"),
});
type ReservaValues = z.infer<typeof reservaSchema>;

// Un destino no tiene precio, fechas ni cupos propios (eso vive en sus
// paquetes). Para reservar, el visitante elige uno de los paquetes
// asociados a este destino desde el mismo modal.
export function DestinoAcciones({
  destinoId,
  destinoNombre,
}: {
  destinoId: number;
  destinoNombre: string;
}) {
  const [modal, setModal] = useState<"reservar" | "consultar" | null>(null);
  useRegistrarVisita({ destinoId });

  return (
    <>
      <div className="flex gap-2 mt-2">
        <Button size="sm" className="flex-1" onClick={() => setModal("reservar")}>
          <CalendarCheck className="size-4" />
          Reservar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          onClick={() => setModal("consultar")}
        >
          <MessageCircleQuestion className="size-4" />
          Consultar
        </Button>
      </div>

      {modal === "reservar" && (
        <ReservarDestinoModal
          destinoId={destinoId}
          destinoNombre={destinoNombre}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "consultar" && (
        <ConsultarDestinoModal
          destinoId={destinoId}
          destinoNombre={destinoNombre}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4">
      <Card className="w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-ink-400 hover:text-ink-700"
        >
          <X className="size-5" />
        </button>
        <h3 className="font-display text-lg font-semibold text-ink-900 mb-1 pr-6">{title}</h3>
        {children}
      </Card>
    </div>
  );
}

function ReservarDestinoModal({
  destinoId,
  destinoNombre,
  onClose,
}: {
  destinoId: number;
  destinoNombre: string;
  onClose: () => void;
}) {
  const clienteProfile = useSessionStore((s) => s.clienteProfile);
  const role = useSessionStore((s) => s.role);
  const queryClient = useQueryClient();

  // Trae todos los paquetes públicos y filtra por destino en el cliente:
  // no hay (ni hace falta) un endpoint propio de "paquetes por destino".
  const { data: paquetes, isLoading } = useQuery({
    queryKey: ["paquetes-por-destino", destinoId],
    queryFn: () => apiFetch<Paquete[]>("/paquetes"),
    select: (data) => data.filter((p) => p.destinoId === destinoId),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReservaValues>({
    resolver: zodResolver(reservaSchema),
    defaultValues: {
      nombreCliente: clienteProfile?.nombre ?? "",
      emailCliente: clienteProfile?.email ?? "",
      telefono: clienteProfile?.telefono ?? "",
      cantidadPersonas: 1,
    },
  });

  const reservar = useMutation({
    mutationFn: (values: ReservaValues) =>
      apiFetch("/reservas", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          emailCliente: values.emailCliente || undefined,
          telefono: values.telefono || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success("¡Reserva enviada! Queda pendiente de confirmación.");
      if (role === "cliente") {
        queryClient.invalidateQueries({ queryKey: ["mis-reservas"] });
      }
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear la reserva");
    },
  });

  return (
    <ModalShell title={`Reservar en: ${destinoNombre}`} onClose={onClose}>
      <p className="text-sm text-ink-600 mb-4">
        Elige uno de los paquetes disponibles para este destino. Tu reserva queda
        pendiente de confirmación por nuestro equipo.
      </p>

      {isLoading ? (
        <div className="h-40 rounded-card bg-sun-100/60 animate-pulse" />
      ) : !paquetes || paquetes.length === 0 ? (
        <p className="text-sm text-ink-400 py-4">
          Todavía no hay paquetes publicados para este destino. Puedes enviarnos una
          consulta y te avisamos apenas haya uno disponible.
        </p>
      ) : (
        <form onSubmit={handleSubmit((v) => reservar.mutate(v))} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink-700">Paquete</span>
            <select
              className="w-full rounded-xl border border-sun-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-clay-400"
              {...register("paqueteId")}
              defaultValue=""
            >
              <option value="" disabled>
                Selecciona un paquete
              </option>
              {paquetes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — ${Number(p.precio).toLocaleString("es-CL")}
                </option>
              ))}
            </select>
            {errors.paqueteId && (
              <span className="text-xs text-danger">{errors.paqueteId.message}</span>
            )}
          </label>
          <Input
            label="Nombre"
            error={errors.nombreCliente?.message}
            {...register("nombreCliente")}
          />
          <Input
            label="Email"
            type="email"
            error={errors.emailCliente?.message}
            {...register("emailCliente")}
          />
          <Input label="Teléfono (opcional)" error={errors.telefono?.message} {...register("telefono")} />
          <Input
            label="Cantidad de personas"
            type="number"
            min={1}
            error={errors.cantidadPersonas?.message}
            {...register("cantidadPersonas")}
          />
          <Button type="submit" disabled={reservar.isPending} className="mt-2">
            {reservar.isPending ? "Enviando..." : "Confirmar reserva"}
          </Button>
        </form>
      )}
    </ModalShell>
  );
}

function ConsultarDestinoModal({
  destinoId,
  destinoNombre,
  onClose,
}: {
  destinoId: number;
  destinoNombre: string;
  onClose: () => void;
}) {
  const clienteProfile = useSessionStore((s) => s.clienteProfile);
  const role = useSessionStore((s) => s.role);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsultaValues>({
    resolver: zodResolver(consultaSchema),
    defaultValues: {
      nombre: clienteProfile?.nombre ?? "",
      email: clienteProfile?.email ?? "",
      telefono: clienteProfile?.telefono ?? "",
      mensaje: "",
    },
  });

  const consultar = useMutation({
    mutationFn: (values: ConsultaValues) =>
      apiFetch("/cotizaciones", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          telefono: values.telefono || undefined,
          destinoId,
        }),
      }),
    onSuccess: () => {
      toast.success("¡Consulta enviada! Te responderemos a tu correo.");
      if (role === "cliente") {
        queryClient.invalidateQueries({ queryKey: ["mis-cotizaciones"] });
      }
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo enviar la consulta");
    },
  });

  return (
    <ModalShell title={`Consultar: ${destinoNombre}`} onClose={onClose}>
      <p className="text-sm text-ink-600 mb-4">
        Tu pregunta se envía directo a nuestro equipo y te contactaremos a la brevedad.
      </p>
      <form onSubmit={handleSubmit((v) => consultar.mutate(v))} className="flex flex-col gap-3">
        <Input label="Nombre" error={errors.nombre?.message} {...register("nombre")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Teléfono (opcional)"
          error={errors.telefono?.message}
          {...register("telefono")}
        />
        <Textarea
          label="Tu pregunta"
          placeholder="Ej: ¿Qué paquetes tienen disponibles para este destino?"
          error={errors.mensaje?.message}
          {...register("mensaje")}
        />
        <Button type="submit" disabled={consultar.isPending} className="mt-2">
          {consultar.isPending ? "Enviando..." : "Enviar consulta"}
        </Button>
      </form>
    </ModalShell>
  );
}
