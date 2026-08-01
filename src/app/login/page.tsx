"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session-store";

const schema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginClientePage() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useSessionStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/cliente/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message ?? "Credenciales inválidas");
        return;
      }

      const me = await fetch("/api/auth/me").then((r) => r.json());
      setSession(me.role, me.profile);

      toast.success("¡Bienvenido de vuelta!");
      router.push(params.get("next") ?? "/dashboard/cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Card className="p-8">
        <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
          Ingresa a tu cuenta
        </h1>
        <p className="text-sm text-ink-600 mb-6">
          Revisa tus reservas y cotizaciones desde aquí.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex justify-end -mt-2">
            <Link
              href="/recuperar-password"
              className="text-xs text-clay-600 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-600 text-center">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-clay-600 font-medium hover:underline">
            Regístrate
          </Link>
        </p>
        <p className="mt-2 text-xs text-ink-400 text-center">
          ¿Eres administrador?{" "}
          <Link href="/login/admin" className="hover:underline">
            Ingresa aquí
          </Link>
        </p>
      </Card>
    </div>
  );
}
