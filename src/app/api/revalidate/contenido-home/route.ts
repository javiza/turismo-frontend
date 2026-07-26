import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSessionTokens } from "@/lib/session";

/**
 * El navbar/footer (layout.tsx) y la home (page.tsx) cachean
 * GET /contenido-home por 60s (ver callBackend `revalidate`) para no
 * pegarle al backend en cada visita. Sin esto, un cambio del admin
 * (logo, slogan, tipografía, título...) tardaba hasta 60s en verse
 * reflejado — demasiado para estar iterando en el panel.
 *
 * El panel admin llama a este endpoint justo después de cada PATCH
 * exitoso a /contenido-home (ver contenido/page.tsx), que invalida el
 * cache al instante con revalidateTag en vez de esperar la ventana de
 * tiempo. Solo se exige que haya sesión de admin activa (mismo criterio
 * liviano que el resto de rutas de este archivo /api) — la única
 * consecuencia de un uso indebido sería invalidar el cache antes de
 * tiempo, no una exposición de datos.
 */
export async function POST() {
  const { adminAccess } = await getSessionTokens();
  if (!adminAccess) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  revalidateTag("contenido-home");
  return NextResponse.json({ revalidated: true });
}
