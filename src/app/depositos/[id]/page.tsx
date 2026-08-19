import Link from "next/link";
import { notFound } from "next/navigation";

import { monthNames } from "@/features/accounting-periods/validation";
import { getDeposit } from "@/features/bank-deposits/service";
import { parseDepositId } from "@/features/bank-deposits/validation";
import { validateActiveCompany } from "@/features/company-context/service";

export default async function DepositDetailPage({ params, searchParams }: PageProps<"/depositos/[id]">) {
  const id = parseDepositId((await params).id);
  if (!id) notFound();
  const deposit = await getDeposit(id);
  if (!deposit) notFound();
  await validateActiveCompany(deposit.companyId);
  const message = (await searchParams).message === "updated" ? "El depósito se actualizó correctamente." : null;
  return <div className="mx-auto max-w-5xl">{message ? <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Depósitos / Detalle</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{formatMoney(deposit.amount)}</h1><p className="mt-2 text-sm text-slate-500">{deposit.companyName} · {monthNames[deposit.periodMonth - 1]} {deposit.periodYear}</p></div><div className="flex gap-2"><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" href="/depositos">Volver</Link>{deposit.status === "available" ? <Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700" href={`/depositos/${id}/editar`}>Editar</Link> : null}</div></div><section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><dl className="grid sm:grid-cols-2"><Detail label="Fecha" value={formatDate(deposit.depositDate)} /><Detail label="Estado" value={deposit.status === "available" ? "Disponible" : "Conciliado"} /><Detail label="Empresa" value={deposit.companyName} /><Detail label="Periodo" value={`${monthNames[deposit.periodMonth - 1]} ${deposit.periodYear}`} /><Detail label="Banco/cuenta" value={`${deposit.bankName} · ${deposit.accountAlias}`} /><Detail label="Lote" value={deposit.batchId ? `Lote #${deposit.batchId}` : "Captura individual"} /><Detail label="Referencia" value={deposit.reference || "—"} /><Detail className="sm:col-span-2" label="Observaciones" value={deposit.notes || "Sin observaciones"} /></dl></section><p className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Los depósitos no se eliminan físicamente. Cuando estén conciliados tampoco podrán editarse.</p></div>;
}

function Detail({ className = "", label, value }: { className?: string; label: string; value: string }) { return <div className={`border-b border-slate-100 p-5 sm:p-6 sm:odd:border-r ${className}`}><dt className="text-xs font-medium text-slate-400">{label}</dt><dd className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-800">{value}</dd></div>; }
function formatMoney(value: string): string { const [integer, decimals] = value.split("."); return `$${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimals}`; }
function formatDate(value: string): string { return new Date(`${value}T12:00:00`).toLocaleDateString("es-MX", { dateStyle: "long" }); }
