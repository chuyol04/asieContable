import Link from "next/link";

import { listAccountingPeriods } from "@/features/accounting-periods/service";
import { ArchivePeriodButton } from "@/features/accounting-periods/components/archive-period-button";
import type { AccountingPeriod, PeriodStatus } from "@/features/accounting-periods/types";
import { monthNames, parsePeriodStatus, parsePeriodYear, periodStatusLabels } from "@/features/accounting-periods/validation";
import { getActiveCompanyId } from "@/features/company-context/service";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = { "invalid-period": "El periodo indicado no es válido.", "period-has-data": "Primero elimina las importaciones de Excel y cualquier depósito, lote o entrega relacionado con este periodo.", "archive-failed": "No fue posible eliminar el periodo." };

export default async function PeriodsPage({ searchParams }: PageProps<"/periodos">) {
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q : "";
  const companyId = await getActiveCompanyId();
  const year = parsePeriodYear(query.year);
  const status = parsePeriodStatus(query.status);
  const periods = companyId ? await listAccountingPeriods({ search, companyId, year, status }) : [];
  const error = typeof query.error === "string" ? errors[query.error] : undefined;
  const message = query.message === "archived" ? "El periodo vacío se eliminó de la operación sin borrar físicamente su registro." : undefined;

  return <>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Operación / Periodos</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Periodos mensuales</h1><p className="mt-2 text-sm leading-6 text-slate-500">Consulta y administra los periodos contables de cada empresa.</p></div><Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700" href="/periodos/nuevo">+ Nuevo periodo</Link></div>
    {error ? <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}
    {message ? <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}

    {!companyId ? <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Selecciona una empresa activa en el encabezado para consultar periodos.</p> : null}
    <form className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1.4fr_120px_150px_auto] lg:items-end" method="get">
      <Field label="Buscar"><input className={inputClass} defaultValue={search} maxLength={191} name="q" placeholder="Empresa, notas o 8/2026" /></Field>
      <Field label="Año"><input className={inputClass} defaultValue={year ?? ""} max={2200} min={1900} name="year" type="number" /></Field>
      <Field label="Estado"><select className={inputClass} defaultValue={status} name="status"><option value="all">Todos</option>{statusOptions.map((item) => <option key={item} value={item}>{periodStatusLabels[item]}</option>)}</select></Field>
      <button className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="submit">Aplicar</button>
    </form>

    <section aria-labelledby="period-results" className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5"><h2 className="text-sm font-semibold text-slate-800" id="period-results">Resultados</h2><span className="text-xs text-slate-400">{periods.length} {periods.length === 1 ? "periodo" : "periodos"}</span></div>
      {periods.length ? <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[850px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500"><tr><th className="px-5 py-3">Empresa</th><th className="px-4 py-3">Mes</th><th className="px-4 py-3">Año</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Creación</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{periods.map((period) => <tr className="hover:bg-slate-50/70" key={period.id}><td className="px-5 py-4 font-semibold text-slate-900">{period.companyName}</td><td className="px-4 py-4 text-slate-600">{monthNames[period.month - 1]}</td><td className="px-4 py-4 text-slate-600">{period.year}</td><td className="px-4 py-4"><StatusBadge status={period.status} /></td><td className="px-4 py-4 text-slate-600">{formatDate(period.createdAt)}</td><td className="px-5 py-4"><PeriodActions period={period} /></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 lg:hidden">{periods.map((period) => <article className="p-4 sm:p-5" key={period.id}><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{period.companyName}</h2><p className="mt-1 text-sm text-slate-500">{monthNames[period.month - 1]} {period.year}</p></div><StatusBadge status={period.status} /></div><p className="mt-4 text-xs text-slate-400">Creado <span className="font-medium text-slate-700">{formatDate(period.createdAt)}</span></p><div className="mt-4 border-t border-slate-100 pt-4"><PeriodActions period={period} /></div></article>)}</div></> : <div className="px-6 py-14 text-center"><p className="font-semibold text-slate-800">No se encontraron periodos.</p><p className="mt-1 text-sm text-slate-500">Ajusta los filtros o crea un nuevo periodo.</p></div>}
    </section>
  </>;
}

const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";
const statusOptions: PeriodStatus[] = ["open", "review", "closed"];

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="text-xs font-semibold text-slate-600">{label}{children}</label>;
}

function PeriodActions({ period }: { period: AccountingPeriod }) {
  return <div className="flex flex-wrap justify-end gap-2"><Link className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" href={`/periodos/${period.id}`}>Ver</Link><Link className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" href={`/periodos/${period.id}/editar`}>Observaciones</Link><ArchivePeriodButton companyId={period.companyId} periodId={period.id} /></div>;
}

function StatusBadge({ status }: { status: PeriodStatus }) {
  const tone = status === "open" ? "bg-emerald-50 text-emerald-700" : status === "review" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{periodStatusLabels[status]}</span>;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-MX", { dateStyle: "medium" });
}
