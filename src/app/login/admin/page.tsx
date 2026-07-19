"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session-store";

const schema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginAdminPage() {
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
      const res = await fetch("/api/auth/admin/login", {
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

      toast.success("Sesión de administrador iniciada");
      router.push(params.get("next") ?? "/dashboard/admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Card className="p-8">
        <div className="flex items-center gap-2 mb-1 text-ink-900">
          <ShieldCheck className="size-5 text-clay-600" />
          <h1 className="font-display text-2xl font-semibold">Acceso administrador</h1>
        </div>
        <p className="text-sm text-ink-600 mb-6">Panel restringido al equipo de la agencia.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="admin@agencia.com"
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
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
