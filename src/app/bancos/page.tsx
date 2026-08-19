import Link from "next/link";

import { setBankStatusAction } from "@/features/banks/actions";
import { listBanks } from "@/features/banks/service";
import type { Bank } from "@/features/banks/types";
import { parseBankStatus } from "@/features/banks/validation";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  "status-updated": "El estado del banco se actualizó correctamente.",
};

const errors: Record<string, string> = {
  "invalid-bank": "El banco indicado no es válido.",
  "status-update": "No fue posible cambiar el estado del banco.",
};

export default async function BanksPage({ searchParams }: PageProps<"/bancos">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const status = parseBankStatus(typeof params.status === "string" ? params.status : undefined);
  const banks = await listBanks(search, status);
  const message = typeof params.message === "string" ? messages[params.message] : undefined;
  const error = typeof params.error === "string" ? errors[params.error] : undefined;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Catálogos / Bancos</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Bancos</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Administra el catálogo general de instituciones bancarias.</p>
        </div>
        <Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-cyan-700" href="/bancos/nuevo">+ Nuevo banco</Link>
      </div>

      {message ? <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <form className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 sm:grid-cols-[1fr_180px_auto] sm:items-end" method="get">
        <label className="text-xs font-semibold text-slate-600">
          Buscar por nombre
          <input className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100" defaultValue={search} maxLength={191} name="q" placeholder="Ej. BBVA" />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Estado
          <select className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100" defaultValue={status} name="status">
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="all">Todos</option>
          </select>
        </label>
        <button className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="submit">Aplicar filtros</button>
      </form>

      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40" aria-labelledby="banks-result">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 id="banks-result" className="text-sm font-semibold text-slate-800">Resultados</h2>
          <span className="text-xs text-slate-400">{banks.length} {banks.length === 1 ? "banco" : "bancos"}</span>
        </div>

        {banks.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                  <tr><th className="px-5 py-3">Nombre</th><th className="px-4 py-3">Nombre corto</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Fecha de creación</th><th className="px-5 py-3 text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {banks.map((bank) => (
                    <tr key={bank.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-semibold text-slate-900">{bank.name}</td>
                      <td className="px-4 py-4 text-slate-600">{bank.shortName || "—"}</td>
                      <td className="px-4 py-4"><StatusBadge active={bank.isActive} /></td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(bank.createdAt)}</td>
                      <td className="px-5 py-4"><BankActions bank={bank} alignRight /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 lg:hidden">
              {banks.map((bank) => (
                <article className="p-4 sm:p-5" key={bank.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div><h2 className="font-semibold text-slate-900">{bank.name}</h2><p className="mt-1 text-sm text-slate-500">{bank.shortName || "Sin nombre corto"}</p></div>
                    <StatusBadge active={bank.isActive} />
                  </div>
                  <p className="mt-4 text-xs text-slate-400">Creado <span className="font-medium text-slate-700">{formatDate(bank.createdAt)}</span></p>
                  <div className="mt-4 border-t border-slate-100 pt-4"><BankActions bank={bank} /></div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-14 text-center"><p className="font-semibold text-slate-800">No se encontraron bancos.</p><p className="mt-1 text-sm text-slate-500">Ajusta los filtros o registra un nuevo banco.</p></div>
        )}
      </section>
    </>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />{active ? "Activo" : "Inactivo"}</span>;
}

function BankActions({ bank, alignRight = false }: { bank: Bank; alignRight?: boolean }) {
  const buttonClass = "rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50";
  return (
    <div className={`flex flex-wrap gap-2 ${alignRight ? "justify-end" : ""}`}>
      <Link className={buttonClass} href={`/bancos/${bank.id}`}>Ver</Link>
      <Link className={buttonClass} href={`/bancos/${bank.id}/editar`}>Editar</Link>
      <form action={setBankStatusAction}><input name="id" type="hidden" value={bank.id} /><input name="isActive" type="hidden" value={String(!bank.isActive)} /><button className={buttonClass} type="submit">{bank.isActive ? "Desactivar" : "Activar"}</button></form>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-MX", { dateStyle: "medium" });
}
