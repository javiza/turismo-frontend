"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session-store";

type EstadoPago = "exitoso" | "rechazado" | "anulado" | "error";

const CONTENIDO: Record<
  EstadoPago,
  { icono: typeof CheckCircle2; color: string; titulo: string; texto: string }
> = {
  exitoso: {
    icono: CheckCircle2,
    color: "text-success",
    titulo: "¡Pago aprobado!",
    texto:
      "Tu reserva quedó confirmada. Te enviamos (o te enviaremos) un correo con el detalle.",
  },
  rechazado: {
    icono: XCircle,
    color: "text-danger",
    titulo: "El banco rechazó el pago",
    texto:
      "Tu reserva sigue pendiente y no se te cobró nada. Puedes intentar de nuevo con otra tarjeta desde tu panel.",
  },
  anulado: {
    icono: AlertTriangle,
    color: "text-sun-600",
    titulo: "Pago anulado",
    texto:
      "Cerraste el pago antes de terminar. Tu reserva sigue pendiente y no se te cobró nada.",
  },
  error: {
    icono: HelpCircle,
    color: "text-ink-400",
    titulo: "No pudimos confirmar el pago",
    texto:
      "Hubo un problema para verificar el resultado. Si te alcanzaron a cobrar y tu reserva sigue pendiente, escríbenos indicando el número de reserva.",
  },
};

function ResultadoPagoContenido() {
  const params = useSearchParams();
  const role = useSessionStore((s) => s.role);
  const estado = (params.get("estado") as EstadoPago | null) ?? "error";
  const reservaId = params.get("reserva");
  const info = CONTENIDO[estado] ?? CONTENIDO.error;
  const Icono = info.icono;

  // El mismo endpoint de pago lo usa tanto el checkout público como el
  // admin (para cobrar una reserva a mano). Si quien pagó es un admin
  // logueado en este navegador, lo mandamos de vuelta a su panel en vez
  // de al dashboard de cliente.
  const volverHref = role === "admin" ? "/dashboard/admin/reservas" : "/dashboard/cliente/viajes";
  const volverLabel = role === "admin" ? "Volver a Reservas" : "Ver mis viajes";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md p-8 text-center">
        <Icono className={`size-14 mx-auto mb-4 ${info.color}`} />
        <h1 className="font-display text-xl font-semibold text-ink-900 mb-2">
          {info.titulo}
        </h1>
        <p className="text-sm text-ink-600 mb-6">
          {info.texto}
          {reservaId && (
            <>
              {" "}
              (Reserva #{reservaId})
            </>
          )}
        </p>
        <div className="flex flex-col gap-2">
          <Link href={volverHref}>
            <Button className="w-full">{volverLabel}</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" className="w-full">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

// useSearchParams necesita un boundary de Suspense en App Router.
export default function ResultadoPagoPage() {
  return (
    <Suspense fallback={null}>
      <ResultadoPagoContenido />
    </Suspense>
  );
}
