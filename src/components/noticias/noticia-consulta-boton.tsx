"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, MessageCircleQuestion } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSessionStore } from "@/store/session-store";

const consultaSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(150),
  email: z.string().email("Email inválido"),
  telefono: z.string().max(50).optional().or(z.literal("")),
  mensaje: z.string().min(1, "Escribe tu pregunta").max(2000),
});
type ConsultaValues = z.infer<typeof consultaSchema>;

/**
 * Botón "Consultar al administrador" para una noticia: abre un modal con
 * el mismo formulario que ya usan paquetes/destinos, y crea una
 * cotización (/cotizaciones) vinculada a la noticia vía noticiaId. La
 * consulta le llega al admin en el panel, en Consultas de clientes.
 */
export function NoticiaConsultaBoton({
  noticiaId,
  noticiaTitulo,
}: {
  noticiaId: number;
  noticiaTitulo: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setAbierto(true)}>
        <MessageCircleQuestion className="size-4" />
        Consultar al administrador
      </Button>

      {abierto && (
        <ConsultarNoticiaModal
          noticiaId={noticiaId}
          noticiaTitulo={noticiaTitulo}
          onClose={() => setAbierto(false)}
        />
      )}
    </>
  );
}

function ConsultarNoticiaModal({
  noticiaId,
  noticiaTitulo,
  onClose,
}: {
  noticiaId: number;
  noticiaTitulo: string;
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
          noticiaId,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4">
      <Card className="w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-ink-400 hover:text-ink-700"
        >
          <X className="size-5" />
        </button>
        <h3 className="font-display text-lg font-semibold text-ink-900 mb-1 pr-6">
          Consultar: {noticiaTitulo}
        </h3>
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
            placeholder="Ej: ¿Esta noticia aplica a paquetes ya reservados?"
            error={errors.mensaje?.message}
            {...register("mensaje")}
          />
          <Button type="submit" disabled={consultar.isPending} className="mt-2">
            {consultar.isPending ? "Enviando..." : "Enviar consulta"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
