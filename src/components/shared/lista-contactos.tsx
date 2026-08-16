"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ListaContactosProps {
  label: string;
  placeholder: string;
  type?: "text" | "email" | "tel";
  values: string[];
  onChange: (values: string[]) => void;
  maxItems?: number;
  addLabel?: string;
  emptyLabel?: string;
}

/**
 * Lista editable de valores de texto (teléfonos o correos adicionales),
 * con botones para agregar/quitar filas. Se usa tanto en el registro de
 * clientes como en "Mi cuenta", para no duplicar esta lógica.
 */
export function ListaContactos({
  label,
  placeholder,
  type = "text",
  values,
  onChange,
  maxItems = 5,
  addLabel = "Agregar",
  emptyLabel = "Ninguno agregado todavía.",
}: ListaContactosProps) {
  function actualizar(idx: number, valor: string) {
    const nuevo = [...values];
    nuevo[idx] = valor;
    onChange(nuevo);
  }

  function agregar() {
    if (values.length >= maxItems) return;
    onChange([...values, ""]);
  }

  function quitar(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-800">{label}</span>
        {values.length < maxItems && (
          <button
            type="button"
            onClick={agregar}
            className="flex items-center gap-1 text-xs text-clay-600 hover:underline"
          >
            <Plus className="size-3.5" />
            {addLabel}
          </button>
        )}
      </div>
      {values.length === 0 && <p className="text-xs text-ink-400">{emptyLabel}</p>}
      {values.map((valor, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            type={type}
            placeholder={placeholder}
            value={valor}
            onChange={(e) => actualizar(idx, e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => quitar(idx)}
            aria-label="Quitar"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
