"use client";

import { type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, MessageCircle, CreditCard, Wallet2, Settings, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PasswordGate } from "@/components/admin/password-gate";

interface ConfigSmtp {
  host: string;
  port: number;
  user: string;
  password: string; // enmascarada al leer
  from: string;
  adminEmail: string;
  configurado: boolean;
}

interface ConfigWhatsapp {
  token: string; // enmascarado al leer
  phoneNumberId: string;
  adminNumber: string;
  apiVersion: string;
  configurado: boolean;
}

interface ConfigTransbank {
  commerceCode: string;
  apiKey: string; // enmascarado al leer
  environment: "integration" | "production";
  configurado: boolean;
}

interface ConfigMercadoPago {
  accessToken: string; // enmascarado al leer
  publicKey: string;
  configurado: boolean;
}

function EstadoBadge({ configurado }: { configurado: boolean }) {
  return configurado ? (
    <span className="flex items-center gap-1 text-xs font-medium text-success">
      <CheckCircle2 className="size-3.5" /> Configurado
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs font-medium text-ink-400">
      <XCircle className="size-3.5" /> Sin configurar (modo simulado)
    </span>
  );
}

// ---------- SMTP ----------

function SeccionSmtp() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["configuracion", "smtp"],
    queryFn: () => apiFetch<ConfigSmtp>("/configuracion/smtp"),
  });

  const mutation = useMutation({
    mutationFn: (body: Partial<ConfigSmtp>) =>
      apiFetch("/configuracion/smtp", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Configuración SMTP guardada");
      qc.invalidateQueries({ queryKey: ["configuracion", "smtp"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Error al guardar"),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({
      host: String(form.get("host") || ""),
      port: Number(form.get("port") || 587),
      user: String(form.get("user") || ""),
      password: String(form.get("password") || ""), // vacío = conservar la actual
      from: String(form.get("from") || ""),
      adminEmail: String(form.get("adminEmail") || ""),
    });
  }

  if (isLoading || !data) return <Card className="p-6 animate-pulse h-40" />;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-clay-600" />
          <h3 className="font-display text-lg font-semibold text-ink-900">Correo (SMTP)</h3>
        </div>
        <EstadoBadge configurado={data.configurado} />
      </div>
      <p className="text-xs text-ink-500 mb-4">
        Sirve para Gmail, Yahoo, Outlook o un SMTP empresarial cualquiera. Si usas Gmail con
        verificación en 2 pasos, necesitas una &quot;contraseña de aplicación&quot; (no tu
        contraseña normal) — se genera en myaccount.google.com/apppasswords.
      </p>
      <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
        <Input name="host" label="Host SMTP" defaultValue={data.host} placeholder="smtp.gmail.com" />
        <Input name="port" label="Puerto" type="number" defaultValue={data.port} placeholder="587" />
        <Input name="user" label="Usuario / correo" defaultValue={data.user} placeholder="tuagencia@gmail.com" />
        <Input
          name="password"
          label="Contraseña"
          type="password"
          placeholder={data.password ? `Guardada: ${data.password}` : "Contraseña o app password"}
        />
        <Input name="from" label="Correo remitente (From)" defaultValue={data.from} placeholder="no-reply@tuagencia.com" />
        <Input
          name="adminEmail"
          label="Correo del admin (recibe avisos)"
          defaultValue={data.adminEmail}
          placeholder="admin@tuagencia.com"
        />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar SMTP"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ---------- WhatsApp ----------

function SeccionWhatsapp() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["configuracion", "whatsapp"],
    queryFn: () => apiFetch<ConfigWhatsapp>("/configuracion/whatsapp"),
  });

  const mutation = useMutation({
    mutationFn: (body: Partial<ConfigWhatsapp>) =>
      apiFetch("/configuracion/whatsapp", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Configuración de WhatsApp guardada");
      qc.invalidateQueries({ queryKey: ["configuracion", "whatsapp"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Error al guardar"),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({
      token: String(form.get("token") || ""), // vacío = conservar el actual
      phoneNumberId: String(form.get("phoneNumberId") || ""),
      adminNumber: String(form.get("adminNumber") || ""),
      apiVersion: String(form.get("apiVersion") || "v20.0"),
    });
  }

  if (isLoading || !data) return <Card className="p-6 animate-pulse h-40" />;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-clay-600" />
          <h3 className="font-display text-lg font-semibold text-ink-900">WhatsApp Business</h3>
        </div>
        <EstadoBadge configurado={data.configurado} />
      </div>
      <p className="text-xs text-ink-500 mb-4">
        Credenciales de la API oficial de Meta (WhatsApp Business Cloud API). Se obtienen en{" "}
        <span className="font-medium">developers.facebook.com</span> creando una app tipo
        &quot;Business&quot; y agregando el producto WhatsApp.
      </p>
      <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
        <Input
          name="token"
          label="Token de acceso"
          type="password"
          placeholder={data.token ? `Guardado: ${data.token}` : "Token permanente de Meta"}
        />
        <Input name="phoneNumberId" label="Phone Number ID" defaultValue={data.phoneNumberId} />
        <Input
          name="adminNumber"
          label="Número del admin (recibe avisos)"
          defaultValue={data.adminNumber}
          placeholder="56912345678"
        />
        <Input name="apiVersion" label="Versión de API" defaultValue={data.apiVersion} placeholder="v20.0" />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar WhatsApp"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ---------- Transbank ----------

function SeccionTransbank() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["configuracion", "transbank"],
    queryFn: () => apiFetch<ConfigTransbank>("/configuracion/transbank"),
  });

  const mutation = useMutation({
    mutationFn: (body: Partial<ConfigTransbank>) =>
      apiFetch("/configuracion/transbank", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Configuración de Transbank guardada");
      qc.invalidateQueries({ queryKey: ["configuracion", "transbank"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Error al guardar"),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({
      commerceCode: String(form.get("commerceCode") || ""),
      apiKey: String(form.get("apiKey") || ""), // vacío = conservar la actual
      environment: form.get("environment") as "integration" | "production",
    });
  }

  if (isLoading || !data) return <Card className="p-6 animate-pulse h-40" />;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-clay-600" />
          <h3 className="font-display text-lg font-semibold text-ink-900">Transbank Webpay Plus</h3>
        </div>
        <EstadoBadge configurado={data.configurado} />
      </div>
      <p className="text-xs text-ink-500 mb-4">
        Mientras no cargues credenciales reales, el sistema usa el ambiente de pruebas público de
        Transbank (no mueve dinero real). Para cobrar de verdad necesitas afiliarte como comercio
        en <span className="font-medium">transbankdevelopers.cl</span> — Transbank te entrega el
        código de comercio y la API key reales tras el proceso de afiliación/certificación.
      </p>
      <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
        <Input name="commerceCode" label="Código de comercio" defaultValue={data.commerceCode} />
        <Input
          name="apiKey"
          label="API Key"
          type="password"
          placeholder={data.apiKey ? `Guardada: ${data.apiKey}` : "API key entregada por Transbank"}
        />
        <Select name="environment" label="Ambiente" defaultValue={data.environment}>
          <option value="integration">Integración (pruebas)</option>
          <option value="production">Producción (dinero real)</option>
        </Select>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar Transbank"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ---------- Mercado Pago ----------

function SeccionMercadoPago() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["configuracion", "mercadopago"],
    queryFn: () => apiFetch<ConfigMercadoPago>("/configuracion/mercadopago"),
  });

  const mutation = useMutation({
    mutationFn: (body: Partial<ConfigMercadoPago>) =>
      apiFetch("/configuracion/mercadopago", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Configuración de Mercado Pago guardada");
      qc.invalidateQueries({ queryKey: ["configuracion", "mercadopago"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Error al guardar"),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({
      accessToken: String(form.get("accessToken") || ""), // vacío = conservar el actual
      publicKey: String(form.get("publicKey") || ""),
    });
  }

  if (isLoading || !data) return <Card className="p-6 animate-pulse h-40" />;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <Wallet2 className="size-4 text-clay-600" />
          <h3 className="font-display text-lg font-semibold text-ink-900">Mercado Pago</h3>
        </div>
        <EstadoBadge configurado={data.configurado} />
      </div>
      <p className="text-xs text-ink-500 mb-4">
        Credenciales desde <span className="font-medium">mercadopago.cl/developers</span> →
        &quot;Tus integraciones&quot; → crea una aplicación → pestaña &quot;Credenciales de
        producción&quot;. <span className="font-semibold">Nota:</span> guardar aquí las
        credenciales deja el dato listo, pero el flujo de cobro con Mercado Pago (checkout) es una
        integración aparte que todavía no está conectada al flujo de reservas — avísame cuando
        tengas las credenciales reales y lo construimos.
      </p>
      <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
        <Input
          name="accessToken"
          label="Access Token"
          type="password"
          placeholder={data.accessToken ? `Guardado: ${data.accessToken}` : "Access token"}
        />
        <Input name="publicKey" label="Public Key" defaultValue={data.publicKey} />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar Mercado Pago"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Settings className="size-5 text-clay-600" />
        <h1 className="font-display text-2xl font-semibold text-ink-900">Configuración</h1>
      </div>

      <PasswordGate
        titulo="Área restringida"
        descripcion="Acá se guardan credenciales sensibles (correo, WhatsApp, pagos). Confirma tu contraseña para continuar."
      >
        <div className="flex flex-col gap-6">
          <SeccionSmtp />
          <SeccionWhatsapp />
          <SeccionTransbank />
          <SeccionMercadoPago />
        </div>
      </PasswordGate>
    </div>
  );
}
