import { redirect } from "next/navigation";

// El dashboard de cliente ahora vive repartido en pestañas (ver layout.tsx):
// "Mis viajes" (reservas + cotizaciones) y "Mi cuenta" (datos + contraseña).
// Esta ruta raíz solo redirige a la primera pestaña.
export default function DashboardClienteIndex() {
  redirect("/dashboard/cliente/viajes");
}
