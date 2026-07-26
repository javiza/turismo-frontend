"use client";

import { useState } from "react";
import { Compass, Phone, Mail, MapPin } from "lucide-react";

export function Footer({
  nombreAgencia = "Tu Agencia de Viajes",
  logoUrl = null,
  sloganColor = "#c2410c",
  sloganFontFamily = "var(--font-hand-caveat)",
  telefono = null,
  correo = null,
  direccion = null,
}: {
  nombreAgencia?: string;
  logoUrl?: string | null;
  sloganColor?: string;
  /** Valor CSS `font-family` ya resuelto (ver resolverFontFamilySlogan en @/lib/slogan-fonts). */
  sloganFontFamily?: string;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
}) {
  const [logoRoto, setLogoRoto] = useState(false);
  const hayDatosContacto = Boolean(telefono || correo || direccion);

  return (
    <footer className="border-t border-sun-100 bg-white/60 mt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {logoUrl && !logoRoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={nombreAgencia}
                className="h-10 w-auto max-w-[150px] object-contain"
                onError={() => setLogoRoto(true)}
              />
            ) : (
              <Compass className="size-7 text-clay-600" strokeWidth={1.75} />
            )}
            <span
              className="text-2xl leading-none"
              style={{ color: sloganColor, fontFamily: sloganFontFamily }}
            >
              {nombreAgencia}
            </span>
          </div>

          {hayDatosContacto && (
            <div className="flex flex-col sm:items-end gap-1 text-sm text-ink-600">
              {telefono && (
                <span className="flex items-center gap-2">
                  <Phone className="size-4 text-ink-400" />
                  {telefono}
                </span>
              )}
              {correo && (
                <span className="flex items-center gap-2">
                  <Mail className="size-4 text-ink-400" />
                  {correo}
                </span>
              )}
              {direccion && (
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 text-ink-400" />
                  {direccion}
                </span>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-ink-600">
          © {new Date().getFullYear()} {nombreAgencia}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
