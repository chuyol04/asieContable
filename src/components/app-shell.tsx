import Image from "next/image";
import Link from "next/link";

import asieLogo from "../../docs/referencias-ui/AsieDegradado.png";
import { logoutAction } from "@/features/auth/actions";
import { requireAdminUser } from "@/features/auth/authorization";
import { CompanySelector } from "@/features/company-context/components/company-selector";
import { getCompanyContext } from "@/features/company-context/service";

type ActiveSection = "home" | "companies" | "clients" | "banks" | "periods" | "deposits" | "reconciliation" | "deliveries" | "purchase-orders" | "suppliers" | "products" | "dashboard";
interface NavigationItem { id: ActiveSection; href: string; label: string }

const navigationGroups: Array<{ label: string; items: NavigationItem[] }> = [
  { label: "General", items: [{ id: "home" as const, href: "/", label: "Inicio" }] },
  { label: "Administración", items: [
    { id: "companies" as const, href: "/empresas", label: "Empresas" },
    { id: "clients" as const, href: "/clientes", label: "Clientes y nóminas" },
  ] },
  { label: "Proceso contable", items: [
    { id: "periods" as const, href: "/periodos", label: "1. Periodos y Excel" },
    { id: "deposits" as const, href: "/depositos", label: "2. Depósitos bancarios" },
    { id: "reconciliation" as const, href: "/conciliacion", label: "3. Conciliación" },
  ] },
  { label: "Control de efectivo", items: [{ id: "deliveries" as const, href: "/entregas", label: "Entregas de efectivo" }] },
  { label: "Compras e inventario", items: [
    { id: "suppliers" as const, href: "/proveedores", label: "1. Proveedores" },
    { id: "products" as const, href: "/productos", label: "2. Productos" },
    { id: "purchase-orders" as const, href: "/ordenes-compra", label: "3. Órdenes de compra" },
  ] },
  { label: "Resultados", items: [{ id: "dashboard" as const, href: "/dashboard", label: "Dashboard y reportes" }] },
];

const navigation = navigationGroups.flatMap((group) => group.items);

export async function AppShell({
  active,
  title,
  children,
}: {
  active: ActiveSection;
  title: string;
  children: React.ReactNode;
}) {
  await requireAdminUser();
  const { companies, activeCompany } = await getCompanyContext();
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#17233c]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white md:flex print:hidden">
        <Brand />
        <nav aria-label="Navegación principal" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navigationGroups.map((group) => <section key={group.label}><p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group.label}</p><div className="space-y-1">{group.items.map((item) => <NavLink key={item.id} {...item} active={active === item.id} />)}</div></section>)}
        </nav>
        <div className="m-4 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700">Fase actual</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">Fase 6 · Reportes</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Indicadores y utilidad administrativa.</p>
        </div>
      </aside>

      <div className="md:pl-60 print:pl-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="md:hidden"><Brand compact /></div>
            <div className="hidden md:block">
              <p className="text-xs text-slate-400">ASIEContable</p>
              <p className="text-sm font-semibold text-slate-800">{title}</p>
            </div>
            <div className="flex min-w-0 items-center gap-2"><CompanySelector activeCompanyId={activeCompany?.id ?? null} companies={companies} /><div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />Entorno local</div><form action={logoutAction}><button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" type="submit">Salir</button></form></div>
          </div>
          <nav aria-label="Navegación móvil" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
            {navigation.map((item) => (
              <NavLink key={item.id} {...item} active={active === item.id} mobile />
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`flex items-center gap-3 ${compact ? "" : "h-16 border-b border-slate-200 px-5"}`} href="/">
      <span className={`relative block shrink-0 overflow-hidden ${compact ? "h-8 w-20" : "h-11 w-28"}`}>
        <Image alt="ASIE" className="absolute left-0 top-1/2 h-auto w-full -translate-y-1/2" priority src={asieLogo} />
      </span>
      <span className={`font-semibold tracking-tight text-cyan-700 ${compact ? "hidden" : "text-sm"}`}>Contable</span>
    </Link>
  );
}

function NavLink({
  href,
  label,
  active,
  mobile = false,
}: {
  id: ActiveSection;
  href: string;
  label: string;
  active: boolean;
  mobile?: boolean;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`${mobile ? "shrink-0 justify-center px-3 py-2" : "px-3 py-2.5"} flex items-center gap-3 rounded-lg text-sm font-medium transition ${active ? "bg-cyan-50 text-cyan-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
      href={href}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-cyan-600" : "bg-slate-300"}`} />
      {label}
    </Link>
  );
}
