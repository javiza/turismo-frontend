"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListaContactos } from "@/components/shared/lista-contactos";
import { KeyRound, IdCard } from "lucide-react";
import type { Cliente } from "@/types";

export default function MiCuentaPage() {
  const queryClient = useQueryClient();

  const { data: perfil } = useQuery({
    queryKey: ["cliente-perfil"],
    queryFn: () => apiFetch<Cliente>("/clientes-auth/perfil"),
  });

  const [nombre, setNombre] = useState(perfil?.nombre ?? "");
  const [email, setEmail] = useState(perfil?.email ?? "");
  const [telefono, setTelefono] = useState(perfil?.telefono ?? "");
  const [rut, setRut] = useState(perfil?.rut ?? "");
  const [telefonosAdicionales, setTelefonosAdicionales] = useState<string[]>([]);
  const [correosAdicionales, setCorreosAdicionales] = useState<string[]>([]);
  const [datosInicializados, setDatosInicializados] = useState(false);

  // El perfil llega asíncrono (useQuery), así que precargamos los
  // inputs recién cuando el dato está disponible, sin pisar lo que el
  // cliente ya haya empezado a escribir.
  useEffect(() => {
    if (perfil && !datosInicializados) {
      setNombre(perfil.nombre);
      setEmail(perfil.email);
      setTelefono(perfil.telefono ?? "");
      setRut(perfil.rut ?? "");
      setTelefonosAdicionales(perfil.telefonosAdicionales ?? []);
      setCorreosAdicionales(perfil.correosAdicionales ?? []);
      setDatosInicializados(true);
    }
  }, [perfil, datosInicializados]);

  const guardarPerfil = useMutation({
    mutationFn: () =>
      apiFetch<Cliente>("/clientes-auth/perfil", {
        method: "PATCH",
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          rut,
          telefonosAdicionales: telefonosAdicionales.map((t) => t.trim()).filter(Boolean),
          correosAdicionales: correosAdicionales.map((c) => c.trim()).filter(Boolean),
        }),
      }),
    onSuccess: (data) => {
      toast.success(
        data.email !== perfil?.email
          ? "Datos actualizados. Usa tu nuevo correo la próxima vez que inicies sesión."
          : "Datos actualizados",
      );
      queryClient.invalidateQueries({ queryKey: ["cliente-perfil"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar tus datos");
    },
  });

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");

  const cambiarPassword = useMutation({
    mutationFn: () =>
      apiFetch("/clientes-auth/password", {
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
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña");
    },
  });

  function handlePasswordSubmit(e: React.FormEvent) {
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
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Mi cuenta</h1>
        <p className="text-sm text-ink-600">Edita tus datos personales y tu contraseña.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 items-start">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <IdCard className="size-5 text-clay-600" />
            <h2 className="font-display text-lg font-semibold text-ink-900">Mis datos</h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardarPerfil.mutate();
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Input
                label="Correo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-ink-400">
                Es el correo con el que inicias sesión: si lo cambias, úsalo la próxima vez.
              </p>
            </div>
            <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <Input
              label="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
            <Input
              label="RUT"
              placeholder="12.345.678-9"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
            />
            <ListaContactos
              label="Teléfonos adicionales"
              placeholder="+56 9 8765 4321"
              type="tel"
              values={telefonosAdicionales}
              onChange={setTelefonosAdicionales}
            />
            <ListaContactos
              label="Correos adicionales"
              placeholder="otro@ejemplo.com"
              type="email"
              values={correosAdicionales}
              onChange={setCorreosAdicionales}
            />
            <Button
              type="submit"
              size="sm"
              disabled={guardarPerfil.isPending}
              className="self-start"
            >
              {guardarPerfil.isPending ? "Guardando..." : "Guardar datos"}
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="size-5 text-clay-600" />
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Cambiar contraseña
            </h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
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
            <Button
              type="submit"
              size="sm"
              disabled={cambiarPassword.isPending}
              className="self-start"
            >
              {cambiarPassword.isPending ? "Guardando..." : "Actualizar contraseña"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
