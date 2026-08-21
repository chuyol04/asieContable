import Image from "next/image";
import { redirect } from "next/navigation";

import asieLogo from "../../../docs/referencias-ui/AsieDegradado.png";
import { logoutAction } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";
import { PayrollList } from "@/features/clients/components/payroll-list";
import { getClientForUser, listPayrollCompanies, listPayrollFiles } from "@/features/clients/service";
import { parseClientId, parsePeriodFilter } from "@/features/clients/validation";

export const dynamic = "force-dynamic";
const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900";
const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default async function MyPayrollPage({ searchParams }: PageProps<"/mis-nominas">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "client") redirect("/");
  const client = await getClientForUser(user.uid, user.email);
  const query = await searchParams;
  const filters = parsePeriodFilter(query.year, query.month, query.name, query.date);
  const payrollCompanyId = parseClientId(query.payrollCompanyId);
  const payrollCompanies = client ? await listPayrollCompanies(client.id, true) : [];
  const files = client ? await listPayrollFiles(client.id, { ...filters, payrollCompanyId, activeOnly: true }) : [];
  return <div className="min-h-screen bg-[#f4f7fb] text-[#17233c]">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className="relative block h-10 w-24 shrink-0"><Image alt="ASIE" className="object-contain" fill priority sizes="96px" src={asieLogo} /></span><div className="min-w-0 border-l border-slate-200 pl-3"><p className="truncate text-xs text-slate-400">Portal de cliente</p><p className="truncate text-sm font-semibold text-slate-800">{client?.name ?? "Cuenta sin asociación"}</p></div></div><form action={logoutAction}><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600" type="submit">Salir</button></form></div></header>
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Consulta documental</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Mis nóminas</h1><p className="mt-2 text-sm text-slate-500">Consulta y descarga tus archivos privados usando tu sesión de ASIE.</p>
      {!client ? <section className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900"><h2 className="font-semibold">Tu usuario no tiene un cliente activo asociado.</h2><p className="mt-2">Solicita al administrador que revise el correo y UID configurados.</p></section> : <><form className="mt-7 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(190px,1fr)_minmax(190px,1fr)_170px_120px_170px_auto] xl:items-end" method="get"><label className="text-xs font-semibold text-slate-600">Empresa<select className={inputClass} defaultValue={payrollCompanyId ?? ""} name="payrollCompanyId"><option value="">Todas</option>{payrollCompanies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Nombre del documento<input className={inputClass} defaultValue={filters.name} maxLength={255} name="name" placeholder="Buscar archivo..." type="search" /></label><label className="text-xs font-semibold text-slate-600">Fecha de nómina<input className={inputClass} defaultValue={filters.date ?? ""} name="date" type="date" /></label><label className="text-xs font-semibold text-slate-600">Año<input className={inputClass} defaultValue={filters.year ?? ""} max={2200} min={2000} name="year" type="number" /></label><label className="text-xs font-semibold text-slate-600">Mes<select className={inputClass} defaultValue={filters.month ?? ""} name="month"><option value="">Todos</option>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label><button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700" type="submit">Filtrar</button></form><section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><PayrollList clientId={client.id} files={files} /></section></>}
    </main>
  </div>;
}
