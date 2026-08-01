"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/store/session-store";

export default function AdminCuentaPage() {
  const perfil = useSessionStore((s) => s.adminProfile);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");

  const cambiarPassword = useMutation({
    mutationFn: () =>
      apiFetch("/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ passwordActual, passwordNueva }),
      }),
    onSuccess: () => {
      toast.success("Contraseña actualizada correctamente");
      setPasswordActual("");
      setPasswordNueva("");
      setConfirmacion("");
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordNueva.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (passwordNueva !== confirmacion) {
      toast.error("La confirmación no coincide con la nueva contraseña");
      return;
    }
    cambiarPassword.mutate();
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Mi cuenta</h1>
        {perfil && (
          <p className="text-sm text-ink-600">
            {perfil.nombre} · {perfil.email}
          </p>
        )}
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="size-5 text-clay-600" />
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Cambiar contraseña
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
            required
          />
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            required
            minLength={8}
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            required
            minLength={8}
          />
          <Button type="submit" disabled={cambiarPassword.isPending} className="self-start">
            {cambiarPassword.isPending ? "Guardando..." : "Actualizar contraseña"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
