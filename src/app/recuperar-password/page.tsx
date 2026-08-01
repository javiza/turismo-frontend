"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email("Ingresa un email válido"),
});

type FormValues = z.infer<typeof schema>;

export default function RecuperarPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      // El backend siempre responde igual exista o no la cuenta, así que
      // acá no hay nada que validar contra la respuesta: solo mostramos
      // el mensaje de "listo, revisa tu correo".
      await fetch("/api/auth/cliente/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Card className="p-8">
        {enviado ? (
          <div className="text-center flex flex-col items-center gap-3">
            <div className="size-12 rounded-full bg-success/15 text-success flex items-center justify-center">
              <MailCheck className="size-6" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink-900">Revisa tu correo</h1>
            <p className="text-sm text-ink-600">
              Si el email está registrado, te enviamos un enlace para restablecer tu contraseña.
              Puede tardar unos minutos en llegar.
            </p>
            <Link href="/login" className="text-clay-600 font-medium hover:underline text-sm mt-2">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
              Recupera tu contraseña
            </h1>
            <p className="text-sm text-ink-600 mb-6">
              Ingresa tu email y te enviaremos un enlace para restablecerla.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                error={errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" disabled={loading} className="mt-2">
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
            </form>

            <p className="mt-6 text-sm text-ink-600 text-center">
              <Link href="/login" className="text-clay-600 font-medium hover:underline">
                Volver a iniciar sesión
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
