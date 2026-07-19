import Link from "next/link";
import {
  LayoutDashboard,
  MailQuestion,
  MessagesSquare,
  Compass,
  MapPinned,
  Package,
  Tag,
  FileText,
  CalendarCheck,
  Wallet,
} from "lucide-react";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid lg:grid-cols-[220px_1fr] gap-8">
      <aside className="lg:sticky lg:top-24 h-max">
        <div className="flex items-center gap-2 mb-6 text-clay-600">
          <Compass className="size-5" />
          <span className="font-display font-semibold">Panel admin</span>
        </div>
        <nav className="flex lg:flex-col gap-1 text-sm">
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <LayoutDashboard className="size-4" />
            Big data
          </Link>
          <Link
            href="/dashboard/admin/destinos"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <MapPinned className="size-4" />
            Destinos
          </Link>
          <Link
            href="/dashboard/admin/reservas"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <CalendarCheck className="size-4" />
            Reservas
          </Link>
          <Link
            href="/dashboard/admin/finanzas"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <Wallet className="size-4" />
            Finanzas
          </Link>
          <Link
            href="/dashboard/admin/paquetes"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <Package className="size-4" />
            Paquetes
          </Link>
          <Link
            href="/dashboard/admin/ofertas"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <Tag className="size-4" />
            Ofertas
          </Link>
          <Link
            href="/dashboard/admin/contenido"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <FileText className="size-4" />
            Contenido home
          </Link>
          <Link
            href="/dashboard/admin/consultas-clientes"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <MessagesSquare className="size-4" />
            Consultas clientes
          </Link>
          <Link
            href="/dashboard/admin/consultas"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sun-100 text-ink-800 font-medium"
          >
            <MailQuestion className="size-4" />
            Consultas IA
          </Link>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
