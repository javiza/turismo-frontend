"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PasswordGateProps {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}

/**
 * Bloquea `children` detrás de un candado que pide reconfirmar la
 * contraseña del admin ya logueado (ver
 * /api/auth/admin/verificar-password: no abre una sesión nueva, solo
 * reintenta el login del backend con esa contraseña). El desbloqueo dura
 * mientras el componente siga montado — recargar la página o volver a
 * entrar a la sección exige escribirla de nuevo, a propósito.
 */
export function PasswordGate({ titulo, descripcion, children }: PasswordGateProps) {
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [password, setPassword] = useState("");
  const [verificando, setVerificando] = useState(false);

  async function handleDesbloquear(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setVerificando(true);
    try {
      const res = await fetch("/api/auth/admin/verificar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDesbloqueado(true);
        setPassword("");
      } else {
        toast.error("Contraseña incorrecta");
      }
    } catch {
      toast.error("No se pudo verificar la contraseña");
    } finally {
      setVerificando(false);
    }
  }

  if (desbloqueado) return <>{children}</>;

  return (
    <div className="flex justify-center py-16">
      <Card className="p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
        <div className="size-12 rounded-full bg-sun-100 text-clay-600 flex items-center justify-center">
          <Lock className="size-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">{titulo}</h2>
          {descripcion && <p className="text-sm text-ink-600 mt-1">{descripcion}</p>}
        </div>
        <form onSubmit={handleDesbloquear} className="w-full flex flex-col gap-3">
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" disabled={verificando} className="w-full">
            {verificando ? "Verificando..." : "Ingresar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
