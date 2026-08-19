import Link from "next/link";

import type { ReportContext } from "../types";

const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";

export function ReportFilters({ context, destination }: { context: ReportContext; destination: "/dashboard" | "/dashboard/utilidad" }) {
  const filters = context.filters;
  return <form action={destination} className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" method="get">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Field label="Periodo"><select className={inputClass} defaultValue={filters?.periodId ?? ""} name="periodId" required>{context.periods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
      <Field label="Desde"><input className={inputClass} defaultValue={filters?.dateFrom ?? ""} name="dateFrom" type="date" /></Field>
      <Field label="Hasta"><input className={inputClass} defaultValue={filters?.dateTo ?? ""} name="dateTo" type="date" /></Field>
      <Field label="Producto"><select className={inputClass} defaultValue={filters?.productId ?? ""} name="productId"><option value="">Todos</option>{context.products.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
      {destination === "/dashboard" ? <>
        <Field label="Banco / cuenta"><select className={inputClass} defaultValue={filters?.bankAccountId ?? ""} name="bankAccountId"><option value="">Todas</option>{context.bankAccounts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
        <Field label="Estado de orden"><select className={inputClass} defaultValue={filters?.orderStatus ?? "all"} name="orderStatus"><option value="all">Todos</option><option value="draft">Borrador</option><option value="confirmed">Confirmada</option><option value="cancelled">Cancelada</option></select></Field>
        <Field label="Estado de entrega"><select className={inputClass} defaultValue={filters?.deliveryStatus ?? "all"} name="deliveryStatus"><option value="all">Todos</option><option value="pending_signature">Pendiente de firma</option><option value="confirmed">Confirmada</option><option value="cancelled">Cancelada</option></select></Field>
      </> : null}
    </div>
    <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link className="text-center text-sm font-semibold text-slate-500 hover:text-slate-800" href={destination}>Limpiar filtros</Link>
      <button className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700" type="submit">Actualizar reporte</button>
    </div>
  </form>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="text-xs font-semibold text-slate-600">{label}{children}</label>;
}
