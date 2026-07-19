"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  nombre: z.string().min(2, "Ingresa tu nombre completo").max(150),
  email: z.string().email("Ingresa un email válido").max(150),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  telefono: z.string().max(50).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function RegistroPage() {
  const router = useRouter();
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
      const res = await fetch("/api/auth/cliente/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "No se pudo crear la cuenta");
        return;
      }

      if (data.autoLogin) {
        const me = await fetch("/api/auth/me").then((r) => r.json());
        setSession(me.role, me.profile);
        toast.success("¡Cuenta creada! Bienvenido.");
        router.push("/dashboard/cliente");
      } else {
        toast.success("Cuenta creada, ahora inicia sesión.");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Card className="p-8">
        <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">Crea tu cuenta</h1>
        <p className="text-sm text-ink-600 mb-6">
          Guarda tus reservas y cotizaciones en un solo lugar.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nombre completo"
            placeholder="Tu nombre"
            error={errors.nombre?.message}
            {...register("nombre")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Teléfono (opcional)"
            placeholder="+56 9 1234 5678"
            error={errors.telefono?.message}
            {...register("telefono")}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-600 text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-clay-600 font-medium hover:underline">
            Ingresa
          </Link>
        </p>
      </Card>
    </div>
  );
}
