import Link from "next/link";

import { getActiveCompanyId } from "@/features/company-context/service";
import { listPurchaseOrders } from "@/features/purchase-orders/service";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/features/purchase-orders/types";
import { parseFilterDate, parsePurchaseOrderStatus } from "@/features/purchase-orders/validation";

export const dynamic = "force-dynamic";
const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900";
const statusLabels = { draft: "Borrador", confirmed: "Confirmada", cancelled: "Cancelada" } as const;

export default async function PurchaseOrdersPage({ searchParams }: PageProps<"/ordenes-compra">) {
  const query = await searchParams;
  const filters = {
    search: typeof query.search === "string" ? query.search : "",
    companyId: await getActiveCompanyId(),
    dateFrom: parseFilterDate(query.dateFrom),
    dateTo: parseFilterDate(query.dateTo),
    status: parsePurchaseOrderStatus(query.status),
  };
  const orders = filters.companyId ? await listPurchaseOrders(filters) : [];
  return <div>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Compras / Órdenes</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Órdenes de compra</h1><p className="mt-2 text-sm text-slate-500">Crea y administra órdenes con productos y configuración propios de cada empresa.</p></div><div className="flex flex-wrap gap-2"><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/ordenes-compra/configuracion">Plantillas</Link><Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700" href="/ordenes-compra/nueva">+ Nueva orden</Link></div></div>
    {filters.companyId ? <form className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-[1.4fr_160px_160px_160px_auto] xl:items-end" method="get"><Field label="Folio o proveedor"><input className={inputClass} defaultValue={filters.search} name="search" placeholder="Buscar…" /></Field><Field label="Desde"><input className={inputClass} defaultValue={filters.dateFrom ?? ""} name="dateFrom" type="date" /></Field><Field label="Hasta"><input className={inputClass} defaultValue={filters.dateTo ?? ""} name="dateTo" type="date" /></Field><Field label="Estado"><select className={inputClass} defaultValue={filters.status} name="status"><option value="all">Todos</option><option value="draft">Borradores</option><option value="confirmed">Confirmadas</option><option value="cancelled">Canceladas</option></select></Field><button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" type="submit">Filtrar</button></form> : <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Selecciona una empresa activa desde el encabezado.</p>}
    <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{orders.length ? <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Folio</th><th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Proveedor</th><th className="px-4 py-3">Expedición</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.map((order) => <tr key={order.id}><td className="px-5 py-4 font-semibold text-slate-900">{order.orderNumber}</td><td className="px-4 py-4 text-slate-600">{order.companyName}</td><td className="px-4 py-4 text-slate-600">{order.supplierLegalName}</td><td className="px-4 py-4 text-slate-600">{formatDate(order.orderDate)}</td><td className="px-4 py-4 font-semibold tabular-nums text-slate-900">{formatMoney(order.total)}</td><td className="px-4 py-4"><Status status={order.status} /></td><td className="px-5 py-4"><Actions order={order} /></td></tr>)}</tbody></table></div><div className="divide-y divide-slate-100 lg:hidden">{orders.map((order) => <article className="p-4 sm:p-5" key={order.id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{order.orderNumber} · {formatMoney(order.total)}</p><p className="mt-1 text-xs text-slate-500">{order.companyName} · {formatDate(order.orderDate)}</p><p className="mt-1 text-sm text-slate-600">{order.supplierLegalName}</p></div><Status status={order.status} /></div><div className="mt-4 border-t border-slate-100 pt-4"><Actions order={order} /></div></article>)}</div></> : <div className="px-6 py-14 text-center"><p className="font-semibold text-slate-800">No hay órdenes que coincidan con los filtros.</p></div>}</section>
  </div>;
}

function Actions({ order }: { order: PurchaseOrder }) { return <div className="flex flex-wrap justify-end gap-2"><Link className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" href={`/ordenes-compra/${order.id}`}>Ver</Link>{order.status === "draft" ? <Link className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" href={`/ordenes-compra/${order.id}/editar`}>Editar</Link> : null}</div>; }
function Status({ status }: { status: PurchaseOrderStatus }) { const tone = status === "confirmed" ? "bg-emerald-50 text-emerald-700" : status === "cancelled" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{statusLabels[status]}</span>; }
function Field({ children, label }: { children: React.ReactNode; label: string }) { return <label className="text-xs font-semibold text-slate-600">{label}{children}</label>; }
function formatMoney(value: string): string { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value)); }
function formatDate(value: string): string { return new Date(`${value}T12:00:00`).toLocaleDateString("es-MX", { dateStyle: "medium" }); }
