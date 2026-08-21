import Link from "next/link";
import { notFound } from "next/navigation";

import { setClientStatusAction, uploadPayrollAction } from "@/features/clients/actions";
import { PayrollList } from "@/features/clients/components/payroll-list";
import { PayrollUploadForm } from "@/features/clients/components/payroll-upload-form";
import { getClient, listPayrollFiles } from "@/features/clients/service";
import { parseClientId, parsePeriodFilter } from "@/features/clients/validation";

export const dynamic = "force-dynamic";
const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900";
const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default async function ClientDetailPage({ params, searchParams }: PageProps<"/clientes/[id]">) {
  const [route, query] = await Promise.all([params, searchParams]);
  const clientId = parseClientId(route.id);
  if (!clientId) notFound();
  const client = await getClient(clientId);
  if (!client) notFound();
  const filters = parsePeriodFilter(query.year, query.month);
  const files = await listPayrollFiles(clientId, filters);
  const now = new Date();
  const message = query.message === "created" ? "El cliente se creó y quedó asociado con Firebase." : query.message === "updated" ? "El cliente se actualizó correctamente." : query.message === "payroll-uploaded" ? "La nómina se guardó en Google Drive." : query.message === "status-updated" || query.message === "payroll-status-updated" ? "El estado se actualizó correctamente." : null;
  const warning = query.message === "payroll-uploaded-sharing-pending" ? `La nómina se guardó en Google Drive, pero no fue posible compartir la carpeta con ${client.userEmail}. Verifica que el correo tenga una cuenta de Google.` : null;
  return <div>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Clientes / Expediente de nómina</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{client.name}</h1><p className="mt-2 text-sm text-slate-500">Usuario: {client.userEmail}</p></div><div className="flex flex-wrap gap-2"><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600" href={`/clientes/${client.id}/editar`}>Editar cliente</Link><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600" href="/clientes">Volver</Link></div></div>
    {message ? <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
    {warning ? <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{warning}</p> : null}
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Info label="Razón social" value={client.legalName} /><Info label="RFC" value={client.taxId} /><Info label="Teléfono" value={client.phone} /><Info label="Firebase UID" value={client.firebaseUid} /></section>
    <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="font-semibold text-slate-900">Subir nómina</h2><p className="mt-1 text-sm text-slate-500">El archivo se guarda de forma privada en Drive y se intenta compartir con {client.userEmail}.</p></div><div className="p-5 sm:p-6">{client.isActive ? <PayrollUploadForm action={uploadPayrollAction.bind(null, clientId)} initialMonth={now.getMonth() + 1} initialYear={now.getFullYear()} /> : <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Activa el cliente para subir nuevos archivos.</p>}</div></section>
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-semibold text-slate-900">Archivos cargados</h2><p className="mt-1 text-sm text-slate-500">{files.length} archivo(s) en la consulta.</p></div><form className="grid grid-cols-2 gap-3 sm:flex sm:items-end" method="get"><label className="text-xs font-semibold text-slate-600">Año<input className={inputClass} defaultValue={filters.year ?? ""} max={2200} min={2000} name="year" type="number" /></label><label className="text-xs font-semibold text-slate-600">Mes<select className={inputClass} defaultValue={filters.month ?? ""} name="month"><option value="">Todos</option>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label><button className="col-span-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700" type="submit">Filtrar</button></form></div>
    <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><PayrollList admin clientId={clientId} files={files} /></section>
    <form action={setClientStatusAction} className="mt-5"><input name="clientId" type="hidden" value={clientId} /><input name="isActive" type="hidden" value={String(!client.isActive)} /><button className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600" type="submit">{client.isActive ? "Desactivar cliente" : "Activar cliente"}</button></form>
  </div>;
}

function Info({ label, value }: { label: string; value: string | null }) { return <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase text-slate-400">{label}</p><p className="mt-2 break-all text-sm font-semibold text-slate-800">{value || "—"}</p></article>; }
