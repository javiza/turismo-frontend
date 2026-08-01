"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    passwordNueva: z.string().min(8, "Mínimo 8 caracteres"),
    confirmacion: z.string().min(8, "Mínimo 8 caracteres"),
  })
  .refine((data) => data.passwordNueva === data.confirmacion, {
    message: "Las contraseñas no coinciden",
    path: ["confirmacion"],
  });

type FormValues = z.infer<typeof schema>;

function RestablecerPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [loading, setLoading] = useState(false);
  const [listo, setListo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/cliente/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, passwordNueva: values.passwordNueva }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "El enlace de recuperación no es válido o venció");
        return;
      }

      setListo(true);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center flex flex-col items-center gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink-900">Enlace inválido</h1>
        <p className="text-sm text-ink-600">
          Este enlace de recuperación no es válido. Solicita uno nuevo.
        </p>
        <Link
          href="/recuperar-password"
          className="text-clay-600 font-medium hover:underline text-sm mt-2"
        >
          Solicitar enlace de recuperación
        </Link>
      </div>
    );
  }

  if (listo) {
    return (
      <div className="text-center flex flex-col items-center gap-3">
        <div className="size-12 rounded-full bg-success/15 text-success flex items-center justify-center">
          <CheckCircle2 className="size-6" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Contraseña actualizada
        </h1>
        <p className="text-sm text-ink-600">Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <Button className="mt-2" onClick={() => router.push("/login")}>
          Ir a iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
        Elige tu nueva contraseña
      </h1>
      <p className="text-sm text-ink-600 mb-6">Ingresa y confirma tu nueva contraseña.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.passwordNueva?.message}
          {...register("passwordNueva")}
        />
        <Input
          label="Confirmar nueva contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmacion?.message}
          {...register("confirmacion")}
        />
        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? "Guardando..." : "Restablecer contraseña"}
        </Button>
      </form>
    </>
  );
}

export default function RestablecerPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Card className="p-8">
        <Suspense fallback={null}>
          <RestablecerPasswordForm />
        </Suspense>
      </Card>
    </div>
  );
}
