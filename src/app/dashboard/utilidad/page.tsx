import Link from "next/link";

import { ReportFilters } from "@/features/reports/components/report-filters";
import { getProfitReport, resolveReportContext } from "@/features/reports/service";
import type { ProfitReportRow } from "@/features/reports/types";
import { getActiveCompanyId } from "@/features/company-context/service";

export const dynamic = "force-dynamic";
const moneyFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export default async function ProfitDashboardPage({ searchParams }: PageProps<"/dashboard/utilidad">) {
  const context = await resolveReportContext(await searchParams, await getActiveCompanyId());
  const report = context.filters ? await getProfitReport(context.filters) : null;
  return <div>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Administración interna</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Costo y utilidad</h1><p className="mt-2 text-sm leading-6 text-slate-500">Venta neta sin IVA, costo estimado o capturado y utilidad de órdenes confirmadas.</p></div><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/dashboard">Volver al dashboard</Link></div>
    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Uso interno.</strong> El costo capturado en el producto tiene prioridad; si falta, se usa su margen configurable. Los renglones sin ninguna configuración se muestran pendientes y no se atribuyen como utilidad.</div>
    <ReportFilters context={context} destination="/dashboard/utilidad" />
    {!report ? <div className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">Selecciona una empresa que tenga un periodo mensual.</div> : <>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Venta neta" value={money(report.summary.netSales)} /><Metric label="Costo" pending={report.summary.estimatedCost === null} value={report.summary.estimatedCost ? money(report.summary.estimatedCost) : "Pendiente"} /><Metric label="Utilidad" pending={report.summary.profit === null} value={report.summary.profit ? money(report.summary.profit) : "Pendiente"} /><Metric label="Margen" pending={report.summary.marginPercentage === null} value={report.summary.marginPercentage ? `${Number(report.summary.marginPercentage).toLocaleString("es-MX", { maximumFractionDigits: 2 })}%` : "Pendiente"} /><Metric label="Cantidad vendida" value={Number(report.summary.quantity).toLocaleString("es-MX", { maximumFractionDigits: 4 })} /></section>
      {report.summary.missingCostItems ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Hay {report.summary.missingCostItems} {report.summary.missingCostItems === 1 ? "partida" : "partidas"} sin costo ni margen configurado. Completa el producto para obtener la utilidad.</p> : null}
      <ProfitTable rows={report.byProduct} title="Utilidad por producto" />
      <ProfitTable orderRows rows={report.byOrder} title="Utilidad por orden" />
    </>}
  </div>;
}

function ProfitTable({ orderRows = false, rows, title }: { orderRows?: boolean; rows: ProfitReportRow[]; title: string }) { return <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-950">{title}</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><Th>{orderRows ? "Orden" : "Producto"}</Th><Th>{orderRows ? "Proveedor" : "Referencia"}</Th><Th>Cantidad</Th><Th>Venta neta</Th><Th>Costo</Th><Th>Utilidad</Th><Th>Margen</Th>{orderRows ? <Th>Detalle</Th> : null}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.key}><Td strong>{row.label}</Td><Td>{row.secondaryLabel ?? "—"}</Td><Td>{Number(row.quantity).toLocaleString("es-MX", { maximumFractionDigits: 4 })}</Td><Td strong>{money(row.netSales)}</Td><Td>{row.estimatedCost ? money(row.estimatedCost) : <Pending />}</Td><Td>{row.profit ? money(row.profit) : <Pending />}</Td><Td>{row.marginPercentage ? `${Number(row.marginPercentage).toLocaleString("es-MX", { maximumFractionDigits: 2 })}%` : <Pending />}</Td>{orderRows ? <Td><Link className="font-semibold text-cyan-700" href={`/ordenes-compra/${row.key.replace("order-", "")}`}>Abrir</Link></Td> : null}</tr>)}</tbody></table></div>{rows.length === 0 ? <p className="px-6 py-12 text-center text-sm text-slate-500">No hay órdenes confirmadas para los filtros seleccionados.</p> : null}</section>; }
function Metric({ label, pending = false, value }: { label: string; pending?: boolean; value: string }) { return <article className={`rounded-xl border bg-white p-5 shadow-sm ${pending ? "border-amber-200" : "border-slate-200"}`}><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-2 text-xl font-semibold tabular-nums ${pending ? "text-amber-800" : "text-slate-950"}`}>{value}</p></article>; }
function Pending() { return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Pendiente</span>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 font-semibold">{children}</th>; }
function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) { return <td className={`px-4 py-3.5 ${strong ? "font-semibold tabular-nums text-slate-900" : "text-slate-600"}`}>{children}</td>; }
function money(value: string): string { return moneyFormatter.format(Number(value)); }
