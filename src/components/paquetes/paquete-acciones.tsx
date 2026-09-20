"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  X,
  CalendarCheck,
  MessageCircleQuestion,
  CreditCard,
  CheckCircle2,
  LogIn,
  UserPlus,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { iniciarPagoWebpay } from "@/lib/webpay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSessionStore } from "@/store/session-store";
import { useRegistrarVisita } from "@/lib/use-registrar-visita";
import type { Reserva } from "@/types";

const reservaSchema = z.object({
  nombreCliente: z.string().min(1, "Requerido").max(150),
  emailCliente: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().max(50).optional().or(z.literal("")),
  cantidadPersonas: z.coerce.number().int().min(1, "Mínimo 1 persona"),
});
type ReservaValues = z.infer<typeof reservaSchema>;

const consultaSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(150),
  email: z.string().email("Email inválido"),
  telefono: z.string().max(50).optional().or(z.literal("")),
  mensaje: z.string().min(1, "Escribe tu pregunta").max(2000),
});
type ConsultaValues = z.infer<typeof consultaSchema>;

export function PaqueteAcciones({
  paqueteId,
  paqueteNombre,
}: {
  paqueteId: number;
  paqueteNombre: string;
}) {
  const [modal, setModal] = useState<"reservar" | "consultar" | null>(null);
  useRegistrarVisita({ paqueteId });

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
        <ReservarModal
          paqueteId={paqueteId}
          paqueteNombre={paqueteNombre}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "consultar" && (
        <ConsultarModal
          paqueteId={paqueteId}
          paqueteNombre={paqueteNombre}
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

function ReservarModal({
  paqueteId,
  paqueteNombre,
  onClose,
}: {
  paqueteId: number;
  paqueteNombre: string;
  onClose: () => void;
}) {
  const clienteProfile = useSessionStore((s) => s.clienteProfile);
  const role = useSessionStore((s) => s.role);
  const loaded = useSessionStore((s) => s.loaded);
  const queryClient = useQueryClient();

  // Una vez creada la reserva, el modal cambia a un segundo paso
  // ofreciendo pagar de inmediato con tarjeta (Webpay). Guardamos la
  // reserva completa (no solo el id) para poder mostrar el monto.
  const [reservaCreada, setReservaCreada] = useState<Reserva | null>(null);

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
      apiFetch<Reserva>("/reservas", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          emailCliente: values.emailCliente || undefined,
          telefono: values.telefono || undefined,
          paqueteId,
        }),
      }),
    onSuccess: (reserva) => {
      toast.success("¡Reserva creada! Puedes pagarla ahora o dejarla pendiente.");
      queryClient.invalidateQueries({ queryKey: ["mis-reservas"] });
      setReservaCreada(reserva);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear la reserva");
    },
  });

  if (reservaCreada) {
    return (
      <ModalShell title={`Reservar: ${paqueteNombre}`} onClose={onClose}>
        <PagarReservaPaso reserva={reservaCreada} onClose={onClose} />
      </ModalShell>
    );
  }

  // Reservar exige cuenta de cliente (el backend rechaza con 401 si no
  // hay sesión): si todavía no sabemos el rol (primer render, ver
  // useLoadSession) no mostramos nada para evitar el parpadeo entre el
  // login-gate y el formulario.
  if (!loaded) {
    return (
      <ModalShell title={`Reservar: ${paqueteNombre}`} onClose={onClose}>
        <div className="h-40 rounded-card bg-sun-100/60 animate-pulse" />
      </ModalShell>
    );
  }

  if (role !== "cliente") {
    return (
      <ModalShell title={`Reservar: ${paqueteNombre}`} onClose={onClose}>
        <IniciaSesionParaReservar onClose={onClose} />
      </ModalShell>
    );
  }

  return (
    <ModalShell title={`Reservar: ${paqueteNombre}`} onClose={onClose}>
      <p className="text-sm text-ink-600 mb-4">
        Tu reserva queda pendiente de confirmación. Puedes pagarla con tarjeta al
        tiro o esperar a que nuestro equipo te contacte.
      </p>
      <form onSubmit={handleSubmit((v) => reservar.mutate(v))} className="flex flex-col gap-3">
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
    </ModalShell>
  );
}

/**
 * Gate de login para el modal de reserva: solo clientes con sesión
 * iniciada pueden reservar (el backend también lo exige, esto solo
 * evita que un visitante llene el formulario para toparse recién al
 * enviar con un 401). Se exporta porque también lo usa DestinoAcciones.
 */
export function IniciaSesionParaReservar({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const next = encodeURIComponent(pathname ?? "/");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-600">
        Para reservar necesitas iniciar sesión con tu cuenta de cliente. Si todavía no
        tienes una, crearla toma un minuto y podrás ver el estado de tus reservas después.
      </p>
      <Button onClick={() => router.push(`/login?next=${next}`)}>
        <LogIn className="size-4" />
        Iniciar sesión
      </Button>
      <Button variant="secondary" onClick={() => router.push(`/registro?next=${next}`)}>
        <UserPlus className="size-4" />
        Crear cuenta
      </Button>
      <Button variant="ghost" onClick={onClose}>
        Cancelar
      </Button>
    </div>
  );
}

/**
 * Segundo paso del modal de reserva: la reserva ya existe (PENDIENTE) y
 * se ofrece pagarla al tiro con Webpay. Es su propio componente porque
 * también se reutiliza, con la misma forma, desde el dashboard del
 * cliente (ver "Mis viajes").
 */
export function PagarReservaPaso({
  reserva,
  onClose,
}: {
  reserva: Reserva;
  onClose: () => void;
}) {
  const [pagando, setPagando] = useState(false);

  async function pagarAhora() {
    setPagando(true);
    try {
      await iniciarPagoWebpay(reserva.id);
      // Si iniciarPagoWebpay() no lanzó error, el navegador ya está
      // navegando hacia Webpay — no hay nada más que hacer acá.
    } catch (err) {
      setPagando(false);
      toast.error(
        err instanceof ApiError ? err.message : "No se pudo iniciar el pago con tarjeta",
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-xl bg-success/10 p-3">
        <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
        <p className="text-sm text-ink-700">
          Reserva #{reserva.id} creada, pendiente de confirmación.
          {reserva.montoTotal != null && (
            <>
              {" "}
              Total: <span className="font-semibold">
                ${Math.round(reserva.montoTotal).toLocaleString("es-CL")}
              </span>
            </>
          )}
        </p>
      </div>
      <p className="text-sm text-ink-600">
        Puedes pagar ahora con tarjeta (débito o crédito) vía Webpay, o dejarla
        pendiente y coordinar el pago con nuestro equipo.
      </p>
      <Button onClick={pagarAhora} disabled={pagando} className="mt-1">
        <CreditCard className="size-4" />
        {pagando ? "Redirigiendo a Webpay..." : "Pagar con tarjeta"}
      </Button>
      <Button variant="secondary" onClick={onClose}>
        Pagar más tarde
      </Button>
    </div>
  );
}

function ConsultarModal({
  paqueteId,
  paqueteNombre,
  onClose,
}: {
  paqueteId: number;
  paqueteNombre: string;
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
          paqueteId,
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
    <ModalShell title={`Consultar: ${paqueteNombre}`} onClose={onClose}>
      <p className="text-sm text-ink-600 mb-4">
        Tu pregunta se envía directo a nuestro equipo y te contactaremos a la brevedad.
      </p>
      <form onSubmit={handleSubmit((v) => consultar.mutate(v))} className="flex flex-col gap-3">
        <Input label="Nombre" error={errors.nombre?.message} {...register("nombre")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input label="Teléfono (opcional)" error={errors.telefono?.message} {...register("telefono")} />
        <Textarea
          label="Tu pregunta"
          placeholder="Ej: ¿El paquete incluye traslados desde el aeropuerto?"
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
