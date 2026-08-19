import Link from "next/link";
import { notFound } from "next/navigation";

import { setBankStatusAction } from "@/features/banks/actions";
import { getBank } from "@/features/banks/service";
import { parseBankId } from "@/features/banks/validation";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  created: "El banco se creó correctamente.",
  updated: "Los datos del banco se actualizaron correctamente.",
};

export default async function BankDetailPage({ params, searchParams }: PageProps<"/bancos/[id]">) {
  const { id: rawId } = await params;
  const id = parseBankId(rawId);
  if (!id) notFound();
  const bank = await getBank(id);
  if (!bank) notFound();
  const query = await searchParams;
  const message = typeof query.message === "string" ? messages[query.message] : undefined;

  return (
    <div className="mx-auto max-w-5xl">
      {message ? <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Bancos / Detalle</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{bank.name}</h1><StatusBadge active={bank.isActive} /></div><p className="mt-2 text-sm text-slate-500">Información general y estado operativo.</p></div>
        <div className="flex gap-2"><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" href="/bancos">Volver</Link><Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700" href={`/bancos/${bank.id}/editar`}>Editar</Link></div>
      </div>
      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="text-sm font-semibold text-slate-900">Datos del banco</h2></div>
        <dl className="grid sm:grid-cols-2"><Detail label="Nombre corto" value={bank.shortName || "—"} /><Detail label="Estado" value={bank.isActive ? "Activo" : "Inactivo"} /><Detail label="Fecha de creación" value={formatDate(bank.createdAt)} /><Detail label="Última actualización" value={formatDate(bank.updatedAt)} /></dl>
      </section>
      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Estado operativo</h2><p className="mt-1 text-sm text-slate-500">Los bancos se desactivan sin eliminar su historial.</p></div><form action={setBankStatusAction}><input name="id" type="hidden" value={bank.id} /><input name="isActive" type="hidden" value={String(!bank.isActive)} /><button className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto" type="submit">{bank.isActive ? "Desactivar banco" : "Activar banco"}</button></form></div>
      </section>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />{active ? "Activo" : "Inactivo"}</span>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-slate-100 p-5 sm:p-6 sm:odd:border-r"><dt className="text-xs font-medium text-slate-400">{label}</dt><dd className="mt-2 text-sm font-medium text-slate-800">{value}</dd></div>;
}

function formatDate(date: Date): string {
  return date.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });
}
