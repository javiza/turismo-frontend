"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  MapPinned,
  Package,
  Tag,
  Newspaper,
  CalendarCheck,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { useSessionStore } from "@/store/session-store";
import type { AnalyticsDashboard, Noticia } from "@/types";

export default function AdminHomePage() {
  const nombre = useSessionStore((s) => s.adminProfile?.nombre);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => apiFetch<AnalyticsDashboard>("/analytics/dashboard"),
  });

  const { data: noticias } = useQuery({
    queryKey: ["admin-noticias"],
    queryFn: () => apiFetch<Noticia[]>("/noticias/admin/todas"),
  });

  const totalServicios =
    dashboard != null
      ? dashboard.total_destinos + dashboard.total_paquetes + dashboard.total_ofertas
      : undefined;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Hola{nombre ? `, ${nombre}` : ""} 👋
        </h1>
        <p className="text-sm text-ink-600">Resumen general de la agencia.</p>
      </div>

      {/* Total de servicios: destino + paquetes + ofertas publicados */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Compass className="size-5" />}
          label="Total de servicios"
          value={totalServicios}
          loading={isLoading}
          highlight
        />
        <StatCard
          icon={<MapPinned className="size-5" />}
          label="Destinos"
          value={dashboard?.total_destinos}
          loading={isLoading}
        />
        <StatCard
          icon={<Package className="size-5" />}
          label="Paquetes"
          value={dashboard?.total_paquetes}
          loading={isLoading}
        />
        <StatCard
          icon={<Tag className="size-5" />}
          label="Ofertas"
          value={dashboard?.total_ofertas}
          loading={isLoading}
        />
        <StatCard
          icon={<CalendarCheck className="size-5" />}
          label="Reservas"
          value={dashboard?.total_reservas}
          loading={isLoading}
        />
        <StatCard
          icon={<Newspaper className="size-5" />}
          label="Noticias"
          value={noticias?.length}
          loading={isLoading}
        />
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900 mb-3">Accesos rápidos</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AccesoRapido
            href="/dashboard/admin/noticias"
            icon={<Newspaper className="size-5" />}
            titulo="Noticias"
            descripcion="Escribe, edita o elimina noticias para los clientes."
          />
          <AccesoRapido
            href="/dashboard/admin/reservas"
            icon={<CalendarCheck className="size-5" />}
            titulo="Reservas"
            descripcion="Revisa y gestiona las reservas de los clientes."
          />
          <AccesoRapido
            href="/dashboard/admin/analytics"
            icon={<BarChart3 className="size-5" />}
            titulo="Big data"
            descripcion="Estadísticas de visitas, ventas y tendencias."
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <Card className={`p-5 flex items-center gap-4 ${highlight ? "ring-2 ring-clay-400" : ""}`}>
      <div
        className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${
          highlight ? "bg-clay-500 text-white" : "bg-sun-100 text-clay-600"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-ink-400">{label}</p>
        <p className="font-display text-xl font-semibold text-ink-900">
          {loading ? "—" : (value ?? "0")}
        </p>
      </div>
    </Card>
  );
}

function AccesoRapido({
  href,
  icon,
  titulo,
  descripcion,
}: {
  href: string;
  icon: React.ReactNode;
  titulo: string;
  descripcion: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 h-full hover:border-clay-300 transition-colors group">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-9 rounded-lg bg-sun-100 text-clay-600 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h3 className="font-medium text-ink-900">{titulo}</h3>
          <ArrowRight className="size-4 text-ink-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
        </div>
        <p className="text-sm text-ink-500">{descripcion}</p>
      </Card>
    </Link>
  );
}
