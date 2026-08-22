import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { monthNames } from "@/features/accounting-periods/validation";
import { PrintButton } from "@/features/cash-deliveries/components/print-button";
import { getCashDelivery } from "@/features/cash-deliveries/service";
import { parseDeliveryId } from "@/features/cash-deliveries/validation";
import { validateActiveCompany } from "@/features/company-context/service";

export default async function DeliveryReceiptPage({ params }: PageProps<"/entregas/[id]/comprobante">) {
  const id = parseDeliveryId((await params).id); if (!id) notFound();
  const delivery = await getCashDelivery(id); if (!delivery) notFound();
  await validateActiveCompany(delivery.companyId);
  return <div className="mx-auto max-w-3xl"><div className="mb-5 flex flex-wrap justify-end gap-2 print:hidden"><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600" href={`/entregas/${id}`}>Volver</Link><PrintButton /></div><article className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none"><div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Phanto Contable</p><h1 className="mt-2 text-2xl font-semibold text-slate-950">Comprobante de entrega de efectivo</h1></div><p className="font-mono text-sm font-semibold text-slate-700">{folio(id)}</p></div><dl className="mt-6 grid gap-5 sm:grid-cols-2"><Item label="Empresa" value={delivery.companyName} /><Item label="Periodo" value={`${monthNames[delivery.periodMonth - 1]} ${delivery.periodYear}`} /><Item label="Fecha" value={formatDate(delivery.deliveryDate)} /><Item label="Monto guardado" value={formatMoney(delivery.storedAmount)} /><Item label="Monto entregado" value={formatMoney(delivery.amount)} /><Item label="Pendiente de entregar" value={formatMoney(Math.max(0, Number(delivery.storedAmount) - Number(delivery.amount)).toFixed(2))} /><Item label="Persona que entrega" value={delivery.deliveredBy} /><Item label="Persona que recibe" value={delivery.receivedBy} /><Item label="Estado" value={delivery.status === "confirmed" ? "Confirmada con firma" : delivery.status === "cancelled" ? "Cancelada" : "Firma pendiente"} /><Item label="Notas del monto" value={delivery.notes || "Sin notas"} /></dl><section className="mt-8 border-t border-slate-200 pt-5"><p className="text-xs font-semibold uppercase text-slate-400">Firma de recepción</p>{delivery.signatureReference ? <Image alt={`Firma de ${delivery.receivedBy}`} className="mt-3 h-auto w-full max-w-lg" height={200} src={`/api/entregas/${id}/firma`} unoptimized width={600} /> : <div className="mt-12 w-full max-w-md border-t border-slate-400 pt-2 text-center text-sm text-slate-500">Firma pendiente</div>}</section></article></div>;
}

function Item({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium text-slate-400">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-800">{value}</dd></div>; }
function folio(id: number): string { return `ENT-${String(id).padStart(6, "0")}`; }
function formatMoney(value: string): string { const [integer, decimals] = value.split("."); return `$${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimals}`; }
function formatDate(value: string): string { return new Date(`${value}T12:00:00`).toLocaleDateString("es-MX", { dateStyle: "long" }); }
