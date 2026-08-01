"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Users2,
  PlusCircle,
  ShieldAlert,
  Trash2,
  Banknote,
  Percent,
  Pencil,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type {
  ResumenFinanciero,
  IngresoMensual,
  IngresoPorItem,
  MovimientoFinanciero,
  TipoMovimientoFinanciero,
  CategoriaGasto,
  MetodoPago,
  GastoPorCategoria,
  ConfiguracionFinanciera,
  Cliente,
} from "@/types";

const CHART_COLORS = {
  confirmados: "#4d9c5c", // success
  pendientes: "#8ec7ff", // sun-400
  cancelados: "#d9432f", // danger
  primary: "#3b82f6", // clay-500
};

const TIPOS_MOVIMIENTO: { value: TipoMovimientoFinanciero; label: string }[] = [
  { value: "INGRESO_MANUAL", label: "Ingreso manual (dinero recibido a mano)" },
  { value: "EGRESO_MANUAL", label: "Egreso manual (gasto operativo)" },
  { value: "ROBO", label: "Robo" },
  { value: "ESTAFA", label: "Estafa" },
  { value: "PERDIDA", label: "Pérdida no requerida" },
  { value: "AJUSTE", label: "Ajuste / corrección" },
];

const ETIQUETA_TIPO: Record<TipoMovimientoFinanciero, string> = {
  INGRESO_MANUAL: "Ingreso manual",
  EGRESO_MANUAL: "Egreso manual",
  ROBO: "Robo",
  ESTAFA: "Estafa",
  PERDIDA: "Pérdida",
  AJUSTE: "Ajuste",
};

const ES_PERDIDA = (tipo: TipoMovimientoFinanciero) =>
  tipo === "ROBO" || tipo === "ESTAFA" || tipo === "PERDIDA";

const CATEGORIAS_GASTO: { value: CategoriaGasto; label: string }[] = [
  { value: "OPERACIONAL", label: "Operacional" },
  { value: "SUELDOS", label: "Sueldos" },
  { value: "MARKETING", label: "Marketing" },
  { value: "PROVEEDORES", label: "Proveedores" },
  { value: "MANTENIMIENTO", label: "Mantenimiento" },
  { value: "IMPUESTOS", label: "Impuestos" },
  { value: "OTRO", label: "Otro" },
];

const ETIQUETA_CATEGORIA: Record<CategoriaGasto | "SIN_CATEGORIA", string> = {
  OPERACIONAL: "Operacional",
  SUELDOS: "Sueldos",
  MARKETING: "Marketing",
  PROVEEDORES: "Proveedores",
  MANTENIMIENTO: "Mantenimiento",
  IMPUESTOS: "Impuestos",
  OTRO: "Otro",
  SIN_CATEGORIA: "Sin categoría",
};

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "WEBPAY", label: "Webpay" },
  { value: "OTRO", label: "Otro" },
];

const ETIQUETA_METODO_PAGO: Record<MetodoPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  WEBPAY: "Webpay",
  OTRO: "Otro",
};

function formatoCLP(valor: number): string {
  return `$${Math.round(valor).toLocaleString("es-CL")}`;
}

const schemaMovimiento = z
  .object({
    tipo: z.enum(["INGRESO_MANUAL", "EGRESO_MANUAL", "ROBO", "ESTAFA", "PERDIDA", "AJUSTE"]),
    monto: z.coerce.number().positive("Debe ser mayor a 0"),
    descripcion: z.string().min(1, "Describe brevemente el movimiento").max(500),
    categoria: z
      .enum([
        "OPERACIONAL",
        "SUELDOS",
        "MARKETING",
        "PROVEEDORES",
        "MANTENIMIENTO",
        "IMPUESTOS",
        "OTRO",
      ])
      .optional(),
    // "Quién pagó" — solo aplica a INGRESO_MANUAL (ver refine abajo).
    // preprocess: el <select> manda "" cuando no se elige cliente, y eso
    // no es un número válido — lo tratamos como "no seleccionado".
    clienteId: z.preprocess(
      (v) => (v === "" || v === undefined ? undefined : v),
      z.coerce.number().int().positive().optional(),
    ),
    pagadorNombre: z.string().max(150).optional(),
    metodoPago: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "WEBPAY", "OTRO"]).optional(),
    ),
  })
  .refine((v) => v.tipo !== "EGRESO_MANUAL" || !!v.categoria, {
    message: "Selecciona la categoría del gasto",
    path: ["categoria"],
  });

type MovimientoFormValues = z.infer<typeof schemaMovimiento>;

export default function AdminFinanzasPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filtroHistorial, setFiltroHistorial] = useState<"TODOS" | "GASTOS">("TODOS");
  const [editandoImpuesto, setEditandoImpuesto] = useState(false);
  const [porcentajeInput, setPorcentajeInput] = useState("");

  const { data: resumen, isLoading: cargandoResumen } = useQuery({
    queryKey: ["finanzas-resumen"],
    queryFn: () => apiFetch<ResumenFinanciero>("/finanzas/resumen"),
  });

  const { data: configuracion } = useQuery({
    queryKey: ["finanzas-configuracion"],
    queryFn: () => apiFetch<ConfiguracionFinanciera>("/finanzas/configuracion"),
  });

  const actualizarImpuesto = useMutation({
    mutationFn: (porcentajeImpuesto: number) =>
      apiFetch<ConfiguracionFinanciera>("/finanzas/configuracion", {
        method: "PATCH",
        body: JSON.stringify({ porcentajeImpuesto }),
      }),
    onSuccess: () => {
      toast.success("Porcentaje de impuesto actualizado");
      setEditandoImpuesto(false);
      queryClient.invalidateQueries({ queryKey: ["finanzas-configuracion"] });
      queryClient.invalidateQueries({ queryKey: ["finanzas-resumen"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "No se pudo actualizar el porcentaje",
      );
    },
  });

  const abrirEdicionImpuesto = () => {
    setPorcentajeInput(String(configuracion?.porcentajeImpuesto ?? resumen?.porcentajeImpuesto ?? ""));
    setEditandoImpuesto(true);
  };

  const guardarImpuesto = () => {
    const valor = Number(porcentajeInput);
    if (Number.isNaN(valor) || valor < 0 || valor > 100) {
      toast.error("Ingresa un porcentaje válido entre 0 y 100");
      return;
    }
    actualizarImpuesto.mutate(valor);
  };

  const { data: mensuales, isLoading: cargandoMensuales } = useQuery({
    queryKey: ["finanzas-mensuales"],
    queryFn: () => apiFetch<IngresoMensual[]>("/finanzas/ingresos-mensuales"),
  });

  const { data: topPaquetes } = useQuery({
    queryKey: ["finanzas-top-paquetes"],
    queryFn: () => apiFetch<IngresoPorItem[]>("/finanzas/top-paquetes"),
  });

  const { data: topDestinos } = useQuery({
    queryKey: ["finanzas-top-destinos"],
    queryFn: () => apiFetch<IngresoPorItem[]>("/finanzas/top-destinos"),
  });

  const { data: movimientos, isLoading: cargandoMovimientos } = useQuery({
    queryKey: ["finanzas-movimientos"],
    queryFn: () => apiFetch<MovimientoFinanciero[]>("/finanzas/movimientos"),
  });

  const { data: gastosPorCategoria } = useQuery({
    queryKey: ["finanzas-gastos-categoria"],
    queryFn: () => apiFetch<GastoPorCategoria[]>("/finanzas/gastos-por-categoria"),
  });

  // Lista de clientes para el selector "¿quién pagó?" del ingreso
  // manual. Solo se pide cuando el formulario está abierto: no tiene
  // sentido cargarla en cada visita a Finanzas si el admin no va a
  // registrar un ingreso.
  const { data: clientes } = useQuery({
    queryKey: ["admin-clientes"],
    queryFn: () => apiFetch<Cliente[]>("/clientes"),
    enabled: showForm,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MovimientoFormValues>({
    resolver: zodResolver(schemaMovimiento),
    defaultValues: { tipo: "INGRESO_MANUAL" },
  });

  const tipoSeleccionado = watch("tipo");

  const abrirFormularioGasto = () => {
    setValue("tipo", "EGRESO_MANUAL");
    setShowForm(true);
  };

  const registrar = useMutation({
    mutationFn: (values: MovimientoFormValues) =>
      apiFetch<MovimientoFinanciero>("/finanzas/movimientos", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Movimiento registrado");
      reset({
        tipo: "INGRESO_MANUAL",
        monto: undefined,
        descripcion: "",
        categoria: undefined,
        clienteId: undefined,
        pagadorNombre: "",
        metodoPago: undefined,
      } as unknown as MovimientoFormValues);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["finanzas-movimientos"] });
      queryClient.invalidateQueries({ queryKey: ["finanzas-resumen"] });
      queryClient.invalidateQueries({ queryKey: ["finanzas-gastos-categoria"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "No se pudo registrar el movimiento");
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/finanzas/movimientos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Movimiento eliminado");
      queryClient.invalidateQueries({ queryKey: ["finanzas-movimientos"] });
      queryClient.invalidateQueries({ queryKey: ["finanzas-resumen"] });
      queryClient.invalidateQueries({ queryKey: ["finanzas-gastos-categoria"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "No se pudo eliminar (solo un super administrador puede hacerlo)",
      );
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Finanzas</h1>
          <p className="text-sm text-ink-600">
            Ingresos reales (reservas confirmadas), ingreso potencial (pendientes), ingreso
            perdido (canceladas), movimientos manuales y resumen fiscal (ganancias, gastos e
            impuestos).
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="secondary" onClick={abrirFormularioGasto}>
            <Banknote className="size-4" />
            Registrar gasto
          </Button>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <PlusCircle className="size-4" />
            {showForm ? "Cancelar" : "Registrar movimiento manual"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-1">
            Nuevo movimiento manual
          </h2>
          <p className="text-xs text-ink-400 mb-4">
            Este monto <strong>nunca</strong> se mezcla con los ingresos por venta de paquetes:
            se suma o resta aparte, en su propia columna del resumen. Un robo, estafa o pérdida
            queda visible como tal, no puede maquillar las ventas reales.
          </p>
          <form
            onSubmit={handleSubmit((v) => registrar.mutate(v))}
            className="grid sm:grid-cols-2 gap-4"
          >
            <Select label="Tipo de movimiento" error={errors.tipo?.message} {...register("tipo")}>
              {TIPOS_MOVIMIENTO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Input
              label="Monto (CLP)"
              type="number"
              step="0.01"
              error={errors.monto?.message}
              {...register("monto")}
            />
            {tipoSeleccionado === "EGRESO_MANUAL" && (
              <Select
                label="Categoría del gasto"
                error={errors.categoria?.message}
                {...register("categoria")}
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIAS_GASTO.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
            {tipoSeleccionado === "INGRESO_MANUAL" && (
              <>
                <Select
                  label="Cliente registrado (opcional)"
                  error={errors.clienteId?.message}
                  {...register("clienteId")}
                >
                  <option value="">Sin vincular a una cuenta</option>
                  {clientes?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.rut ? `· ${c.rut}` : ""} ({c.email})
                    </option>
                  ))}
                </Select>
                <Input
                  label="O nombre de quien pagó (si no tiene cuenta)"
                  placeholder="Ej: Juan Pérez (pasajero sin cuenta)"
                  error={errors.pagadorNombre?.message}
                  {...register("pagadorNombre")}
                />
                <Select
                  label="Método de pago"
                  error={errors.metodoPago?.message}
                  {...register("metodoPago")}
                >
                  <option value="">Selecciona un método</option>
                  {METODOS_PAGO.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </>
            )}
            <div className="sm:col-span-2">
              <Textarea
                label="Descripción"
                placeholder="Ej: pago en efectivo recibido en oficina el 18/07, o detalle del robo/estafa"
                error={errors.descripcion?.message}
                {...register("descripcion")}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={registrar.isPending}>
                {registrar.isPending ? "Guardando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet className="size-5" />}
          label="Ingresos confirmados (ventas)"
          value={resumen ? formatoCLP(resumen.ingresosConfirmados) : undefined}
          loading={cargandoResumen}
          tone="success"
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="Ingresos pendientes"
          value={resumen ? formatoCLP(resumen.ingresosPendientes) : undefined}
          loading={cargandoResumen}
          tone="warning"
        />
        <StatCard
          icon={<TrendingDown className="size-5" />}
          label="Ingresos perdidos (canceladas)"
          value={resumen ? formatoCLP(resumen.ingresosCancelados) : undefined}
          loading={cargandoResumen}
          tone="danger"
        />
        <StatCard
          icon={<Receipt className="size-5" />}
          label="Ticket promedio"
          value={resumen ? formatoCLP(resumen.ticketPromedio) : undefined}
          loading={cargandoResumen}
        />
      </div>

      {/* Movimientos manuales */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<PlusCircle className="size-5" />}
          label="Ingresos manuales"
          value={resumen ? formatoCLP(resumen.ingresosManuales) : undefined}
          loading={cargandoResumen}
          tone="success"
        />
        <StatCard
          label="Egresos manuales"
          value={resumen ? formatoCLP(resumen.egresosManuales) : undefined}
          loading={cargandoResumen}
        />
        <StatCard
          icon={<ShieldAlert className="size-5" />}
          label="Robo / estafa / pérdida"
          value={resumen ? formatoCLP(resumen.perdidasManuales) : undefined}
          loading={cargandoResumen}
          tone="danger"
        />
      </div>

      {/* Resumen fiscal: ganancias, gastos, impuestos (% editable) y ganancia neta */}
      <Card className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="font-medium text-ink-900">Resumen fiscal</h3>
            <p className="text-xs text-ink-400 mt-1">
              Ganancias y gastos totales del período, e impuesto calculado sobre la ganancia
              según el porcentaje vigente.
            </p>
          </div>
          {!editandoImpuesto ? (
            <Button size="sm" variant="secondary" onClick={abrirEdicionImpuesto}>
              <Pencil className="size-4" />
              Editar % impuesto
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-28">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={porcentajeInput}
                  onChange={(e) => setPorcentajeInput(e.target.value)}
                  aria-label="Porcentaje de impuesto"
                />
              </div>
              <Button size="sm" onClick={guardarImpuesto} disabled={actualizarImpuesto.isPending}>
                {actualizarImpuesto.isPending ? "Guardando..." : "Guardar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditandoImpuesto(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Wallet className="size-5" />}
            label="Ganancias totales"
            value={resumen ? formatoCLP(resumen.gananciasTotales) : undefined}
            loading={cargandoResumen}
            tone="success"
          />
          <StatCard
            icon={<TrendingDown className="size-5" />}
            label="Gastos totales"
            value={resumen ? formatoCLP(resumen.gastosTotales) : undefined}
            loading={cargandoResumen}
            tone="danger"
          />
          <StatCard
            icon={<Percent className="size-5" />}
            label={`Impuestos (${(configuracion?.porcentajeImpuesto ?? resumen?.porcentajeImpuesto ?? 0).toLocaleString("es-CL")}%)`}
            value={resumen ? formatoCLP(resumen.impuestos) : undefined}
            loading={cargandoResumen}
          />
          <StatCard
            label="Ganancia neta (post-impuesto)"
            value={resumen ? formatoCLP(resumen.gananciaNeta) : undefined}
            loading={cargandoResumen}
            tone="success"
          />
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users2 className="size-5" />}
          label="Reservas confirmadas"
          value={resumen?.reservasConfirmadas}
          loading={cargandoResumen}
        />
        <StatCard
          label="Reservas pendientes"
          value={resumen?.reservasPendientes}
          loading={cargandoResumen}
        />
        <StatCard
          label="Reservas canceladas"
          value={resumen?.reservasCanceladas}
          loading={cargandoResumen}
        />
        <StatCard
          label="Personas confirmadas"
          value={resumen?.personasConfirmadas}
          loading={cargandoResumen}
        />
      </div>

      {/* Ingresos mensuales */}
      <Card className="p-6">
        <h3 className="font-medium text-ink-900 mb-4">Ingresos mensuales (últimos 12 meses)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mensuales ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffe4ad" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) =>
                  new Date(v as string).toLocaleDateString("es-CL", { month: "short" })
                }
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatoCLP(v as number)} />
              <Tooltip
                labelFormatter={(v) => new Date(v as string).toLocaleDateString("es-CL")}
                formatter={(value: number) => formatoCLP(value)}
              />
              <Legend />
              <Bar
                dataKey="confirmados"
                name="Confirmados"
                fill={CHART_COLORS.confirmados}
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="pendientes"
                name="Pendientes"
                fill={CHART_COLORS.pendientes}
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="cancelados"
                name="Cancelados"
                fill={CHART_COLORS.cancelados}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {!cargandoMensuales && (!mensuales || mensuales.length === 0) && (
          <p className="text-sm text-ink-400 text-center py-8">
            Todavía no hay reservas en los últimos 12 meses.
          </p>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-medium text-ink-900 mb-4">Top paquetes por ingresos</h3>
          <RankingIngresos items={topPaquetes} />
        </Card>

        <Card className="p-6">
          <h3 className="font-medium text-ink-900 mb-4">Top destinos por ingresos</h3>
          <RankingIngresos items={topDestinos} />
        </Card>
      </div>

      {/* Gastos por categoría */}
      {gastosPorCategoria && gastosPorCategoria.length > 0 && (
        <Card className="p-6">
          <h3 className="font-medium text-ink-900 mb-1">Gastos por categoría</h3>
          <p className="text-xs text-ink-400 mb-4">
            Desglose de los egresos manuales (gastos operativos) registrados, por rubro.
          </p>
          <ul className="flex flex-col gap-3">
            {(() => {
              const max = Math.max(...gastosPorCategoria.map((g) => g.total), 1);
              return gastosPorCategoria.map((g) => (
                <li key={g.categoria} className="flex items-center gap-3">
                  <span className="text-sm text-ink-800 w-32 shrink-0 truncate">
                    {ETIQUETA_CATEGORIA[g.categoria]}
                  </span>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-sun-100 overflow-hidden">
                      <div
                        className="h-full bg-info rounded-full"
                        style={{ width: `${(g.total / max) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ink-900 shrink-0 w-28 text-right">
                    {formatoCLP(g.total)}
                  </span>
                </li>
              ));
            })()}
          </ul>
        </Card>
      )}

      {/* Historial de movimientos manuales */}
      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <h3 className="font-medium text-ink-900">Movimientos manuales</h3>
          <div className="flex gap-1 bg-sun-50 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setFiltroHistorial("TODOS")}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                filtroHistorial === "TODOS"
                  ? "bg-white shadow-sm text-ink-900"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroHistorial("GASTOS")}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                filtroHistorial === "GASTOS"
                  ? "bg-white shadow-sm text-ink-900"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              Solo gastos
            </button>
          </div>
        </div>
        <p className="text-xs text-ink-400 mb-4">
          Historial de dinero cargado a mano. Solo un super administrador puede eliminar un
          registro de esta lista, para que un robo o estafa no pueda borrarse por error o a
          propósito.
        </p>
        {cargandoMovimientos ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-card bg-sun-100/60 animate-pulse" />
            ))}
          </div>
        ) : (() => {
            const listaFiltrada =
              filtroHistorial === "GASTOS"
                ? movimientos?.filter((m) => m.tipo === "EGRESO_MANUAL")
                : movimientos;
            if (!listaFiltrada || listaFiltrada.length === 0) {
              return (
                <p className="text-sm text-ink-400 text-center py-8">
                  {filtroHistorial === "GASTOS"
                    ? "Todavía no hay gastos registrados."
                    : "Todavía no hay movimientos manuales registrados."}
                </p>
              );
            }
            return (
              <div className="flex flex-col gap-2">
                {listaFiltrada.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-sun-100 p-3"
                  >
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                        ES_PERDIDA(m.tipo)
                          ? "bg-danger/15 text-danger"
                          : m.tipo === "INGRESO_MANUAL"
                            ? "bg-success/15 text-success"
                            : "bg-ink-100 text-ink-600"
                      }`}
                    >
                      {ETIQUETA_TIPO[m.tipo]}
                    </span>
                    {m.categoria && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full shrink-0 bg-info/15 text-info">
                        {ETIQUETA_CATEGORIA[m.categoria]}
                      </span>
                    )}
                    {m.metodoPago && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full shrink-0 bg-sun-200 text-ink-700">
                        {ETIQUETA_METODO_PAGO[m.metodoPago]}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-800 truncate">{m.descripcion}</p>
                      <p className="text-xs text-ink-400">
                        {new Date(m.createdAt).toLocaleString("es-CL")}
                        {m.usuario?.nombre && <> · registrado por {m.usuario.nombre}</>}
                        {(m.cliente?.nombre || m.pagadorNombre) && (
                          <>
                            {" "}
                            · pagó{" "}
                            <span className="font-medium text-ink-600">
                              {m.cliente?.nombre ?? m.pagadorNombre}
                              {m.cliente?.rut ? ` (${m.cliente.rut})` : ""}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink-900 shrink-0">
                      {formatoCLP(m.monto)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={eliminar.isPending}
                      onClick={() => eliminar.mutate(m.id)}
                      aria-label="Eliminar movimiento"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            );
          })()}
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  tone,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | number;
  loading: boolean;
  tone?: "success" | "warning" | "danger";
}) {
  const toneStyles = {
    success: "bg-success/15 text-success",
    warning: "bg-sun-200 text-ink-800",
    danger: "bg-danger/15 text-danger",
  };

  return (
    <Card className="p-5 flex items-center gap-4">
      {icon && (
        <div
          className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${
            tone ? toneStyles[tone] : "bg-sun-100 text-clay-600"
          }`}
        >
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-ink-400">{label}</p>
        <p className="font-display text-xl font-semibold text-ink-900">
          {loading ? "—" : (value ?? "0")}
        </p>
      </div>
    </Card>
  );
}

function RankingIngresos({ items }: { items?: IngresoPorItem[] }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-ink-400">Sin ingresos confirmados todavía.</p>;
  }

  const max = Math.max(...items.map((i) => i.ingresos), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, idx) => (
        <li key={item.id} className="flex items-center gap-3">
          <span className="text-xs text-ink-400 w-4">{idx + 1}</span>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-ink-800 truncate">{item.nombre}</span>
              <span className="text-ink-400 shrink-0 ml-2">
                {formatoCLP(item.ingresos)} · {item.reservas} res.
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-sun-100 overflow-hidden">
              <div
                className="h-full bg-clay-500 rounded-full"
                style={{ width: `${(item.ingresos / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
