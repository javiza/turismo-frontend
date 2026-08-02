"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { RefreshCcw, TrendingUp, Users, MapPinned, Package } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session-store";
import type {
  AnalyticsDashboard,
  TopItem,
  TendenciaMensual,
  VentasMensuales,
} from "@/types";

const CHART_COLORS = {
  primary: "#3b82f6", // clay-500
  secondary: "#8ec7ff", // sun-400
};

export default function AdminAnalyticsPage() {
  const queryClient = useQueryClient();
  const role = useSessionStore((s) => s.adminProfile?.rol);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => apiFetch<AnalyticsDashboard>("/analytics/dashboard"),
  });

  const { data: topDestinos } = useQuery({
    queryKey: ["analytics-top-destinos"],
    queryFn: () => apiFetch<TopItem[]>("/analytics/top-destinos"),
  });

  const { data: topPaquetes } = useQuery({
    queryKey: ["analytics-top-paquetes"],
    queryFn: () => apiFetch<TopItem[]>("/analytics/top-paquetes"),
  });

  const { data: tendencia } = useQuery({
    queryKey: ["analytics-tendencia"],
    queryFn: () => apiFetch<TendenciaMensual[]>("/analytics/tendencia-mensual"),
  });

  const { data: ventas } = useQuery({
    queryKey: ["analytics-ventas"],
    queryFn: () => apiFetch<VentasMensuales[]>("/analytics/ventas-mensuales"),
  });

  async function handleRefrescar() {
    try {
      await apiFetch("/analytics/refrescar-vistas", { method: "POST" });
      toast.success("Vistas materializadas actualizadas");
      queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-top-destinos"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-top-paquetes"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-tendencia"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-ventas"] });
    } catch {
      toast.error("No se pudo refrescar (requiere rol SUPER_ADMIN)");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Big data</h1>
          <p className="text-sm text-ink-600">Visitas, reservas, cotizaciones y ventas.</p>
        </div>
        {role === "SUPER_ADMIN" && (
          <Button variant="secondary" size="sm" onClick={handleRefrescar}>
            <RefreshCcw className="size-4" />
            Refrescar vistas
          </Button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="size-5" />}
          label="Visitas totales"
          value={dashboard?.total_visitas}
          loading={isLoading}
        />
        <StatCard
          icon={<Package className="size-5" />}
          label="Reservas"
          value={dashboard?.total_reservas}
          loading={isLoading}
        />
        <StatCard
          icon={<MapPinned className="size-5" />}
          label="Destinos"
          value={dashboard?.total_destinos}
          loading={isLoading}
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="Paquetes / ofertas"
          value={
            dashboard
              ? `${dashboard.total_paquetes} / ${dashboard.total_ofertas}`
              : undefined
          }
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-medium text-ink-900 mb-4">Tendencia mensual de visitas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendencia ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffe4ad" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="visitas"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium text-ink-900 mb-4">Ventas e ingresos mensuales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventas ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffe4ad" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString("es-CL", { month: "short" })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(v) => new Date(v as string).toLocaleDateString("es-CL")}
                />
                <Bar dataKey="ingresos" fill={CHART_COLORS.secondary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium text-ink-900 mb-4">Top destinos por visitas</h3>
          <TopList items={topDestinos} />
        </Card>

        <Card className="p-6">
          <h3 className="font-medium text-ink-900 mb-4">Top paquetes por visitas</h3>
          <TopList items={topPaquetes} />
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number;
  loading: boolean;
}) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className="size-11 rounded-xl bg-sun-100 text-clay-600 flex items-center justify-center shrink-0">
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

function TopList({ items }: { items?: TopItem[] }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-ink-400">Sin datos todavía.</p>;
  }

  const max = Math.max(...items.map((i) => i.visitas), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, idx) => (
        <li key={item.id} className="flex items-center gap-3">
          <span className="text-xs text-ink-400 w-4">{idx + 1}</span>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-ink-800">{item.nombre}</span>
              <span className="text-ink-400">{item.visitas}</span>
            </div>
            <div className="h-1.5 rounded-full bg-sun-100 overflow-hidden">
              <div
                className="h-full bg-clay-500 rounded-full"
                style={{ width: `${(item.visitas / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
