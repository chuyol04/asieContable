import Link from "next/link";

import { setClientStatusAction } from "@/features/clients/actions";
import { listClients } from "@/features/clients/service";
import { parseClientStatus } from "@/features/clients/validation";

export const dynamic = "force-dynamic";
const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900";

export default async function ClientsPage({ searchParams }: PageProps<"/clientes">) {
  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search.trim().slice(0, 191) : "";
  const status = parseClientStatus(query.status);
  const clients = await listClients(search, status);
  return <div>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Administración / Nóminas</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Clientes</h1><p className="mt-2 text-sm text-slate-500">Asocia un usuario Firebase y administra sus archivos de nómina.</p></div><Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-center text-sm font-semibold text-white" href="/clientes/nuevo">+ Nuevo cliente</Link></div>
    <form className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.3fr_180px_auto] lg:items-end" method="get"><Field label="Buscar"><input className={inputClass} defaultValue={search} name="search" placeholder="Nombre, RFC o correo" /></Field><Field label="Estado"><select className={inputClass} defaultValue={status} name="status"><option value="active">Activos</option><option value="inactive">Inactivos</option><option value="all">Todos</option></select></Field><button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700" type="submit">Filtrar</button></form>
    <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{clients.length ? <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Cliente</th><th className="px-4 py-3">RFC</th><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Estado</th><th className="px-5 py-3">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{clients.map((client) => <tr key={client.id}><td className="px-5 py-4"><p className="font-semibold text-slate-900">{client.name}</p><p className="text-xs text-slate-500">{client.legalName ?? "Sin razón social"}</p></td><td className="px-4 py-4 text-slate-600">{client.taxId ?? "—"}</td><td className="px-4 py-4 text-slate-600">{client.userEmail}</td><td className="px-4 py-4"><Status active={client.isActive} /></td><td className="px-5 py-4"><Actions client={client} /></td></tr>)}</tbody></table></div><div className="divide-y divide-slate-100 md:hidden">{clients.map((client) => <article className="p-5" key={client.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold text-slate-900">{client.name}</h2><p className="mt-1 truncate text-sm text-slate-500">{client.userEmail}</p></div><Status active={client.isActive} /></div><div className="mt-4"><Actions client={client} /></div></article>)}</div></> : <p className="px-6 py-14 text-center text-sm text-slate-500">No hay clientes que coincidan con los filtros.</p>}</section>
  </div>;
}

function Actions({ client }: { client: Awaited<ReturnType<typeof listClients>>[number] }) { return <div className="flex flex-wrap gap-2"><Link className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white" href={`/clientes/${client.id}`}>Ver nóminas</Link><Link className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600" href={`/clientes/${client.id}/editar`}>Editar</Link><form action={setClientStatusAction}><input name="clientId" type="hidden" value={client.id} /><input name="isActive" type="hidden" value={String(!client.isActive)} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600" type="submit">{client.isActive ? "Desactivar" : "Activar"}</button></form></div>; }
function Status({ active }: { active: boolean }) { return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Activo" : "Inactivo"}</span>; }
function Field({ children, label }: { children: React.ReactNode; label: string }) { return <label className="text-xs font-semibold text-slate-600">{label}{children}</label>; }
