"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MailCheck, MailWarning } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ConsultaEmailIA } from "@/types";

export default function ConsultasIaPage() {
  const [tab, setTab] = useState<"todas" | "pendientes">("pendientes");

  const { data, isLoading } = useQuery({
    queryKey: ["consultas-ia", tab],
    queryFn: () =>
      apiFetch<ConsultaEmailIA[]>(
        tab === "pendientes" ? "/asistente-ia/consultas/pendientes" : "/asistente-ia/consultas",
      ),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Consultas IA</h1>
        <p className="text-sm text-ink-600">
          Lo que el asistente respondió por correo en tu nombre, y lo que quedó escalado. Para
          responder un correo escalado, hazlo directamente desde Gmail.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={tab === "pendientes" ? "primary" : "ghost"}
          onClick={() => setTab("pendientes")}
        >
          Pendientes
        </Button>
        <Button
          size="sm"
          variant={tab === "todas" ? "primary" : "ghost"}
          onClick={() => setTab("todas")}
        >
          Todas
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-card bg-sun-100/60 animate-pulse" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-card border border-dashed border-sun-300 bg-sun-50/50 py-12 text-center text-ink-400 text-sm">
          No hay consultas para mostrar.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((c) => (
            <Card key={c.id} className="p-4 flex items-center gap-4">
              <div
                className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                  c.estado === "ESCALADA"
                    ? "bg-danger/15 text-danger"
                    : c.estado === "ERROR"
                      ? "bg-sun-200 text-sun-800"
                      : "bg-success/15 text-success"
                }`}
              >
                {c.estado === "RESPONDIDA_IA" ? (
                  <MailCheck className="size-4" />
                ) : (
                  <MailWarning className="size-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink-900 truncate">
                  {c.asunto || "(sin asunto)"}
                </p>
                <p className="text-xs text-ink-400">{c.remitente}</p>
              </div>
              <span className="text-xs text-ink-400 shrink-0">
                {new Date(c.createdAt).toLocaleDateString("es-CL")}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
