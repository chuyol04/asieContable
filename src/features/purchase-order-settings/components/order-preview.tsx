import Image from "next/image";

import type { Company } from "@/features/companies/types";
import type { PurchaseOrderSettings } from "../types";
import { formatNextOrderNumber } from "../validation";

export function PurchaseOrderPreview({ company, settings }: { company: Company; settings: PurchaseOrderSettings | null }) {
  const prefix = settings?.orderPrefix ?? null;
  const nextNumber = settings?.nextOrderNumber ?? 1;
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Vista previa sencilla</p><p className="mt-1 text-xs text-slate-500">Representación informativa; no es el PDF final.</p></div>
    <div className="rounded-lg border border-slate-300 bg-white p-4 text-[11px] text-slate-700 sm:p-6">
      <div className="grid grid-cols-[80px_1fr_auto] items-start gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-14 items-center justify-center">{settings?.logoUrl ? <Image alt={`Logo de ${company.name}`} className="max-h-14 w-auto object-contain" height={56} src={`/api/empresas/${company.id}/ordenes/logo`} unoptimized width={80} /> : <span className="text-center text-[10px] text-slate-400">Sin logo</span>}</div>
        <div className="text-center"><p className="font-bold uppercase text-slate-900">{company.name}</p>{settings?.headerText ? <p className="mt-1 whitespace-pre-wrap">{settings.headerText}</p> : null}<p>{company.phone ?? ""}</p></div>
        <div className="text-right"><p>Orden de compra</p><p className="text-base font-bold text-slate-950">{formatNextOrderNumber(prefix, nextNumber)}</p></div>
      </div>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2"><PreviewLine label="Razón social" value={company.legalName} /><PreviewLine label="RFC" value={company.taxId} /><PreviewLine label="Correo" value={company.email} /><PreviewLine label="Teléfono" value={company.phone} /><PreviewLine className="sm:col-span-2" label="Dirección" value={company.fiscalAddress} /></dl>
      <div className="mt-5 h-24 rounded border border-slate-200 bg-slate-50"><div className="grid grid-cols-4 border-b border-slate-200 bg-slate-100 px-2 py-1 font-semibold"><span className="col-span-2">Producto / descripción</span><span>Precio</span><span>IVA</span></div></div>
      {settings?.defaultNotes ? <p className="mt-3 whitespace-pre-wrap text-slate-500">{settings.defaultNotes}</p> : null}
      <div className="mt-10 grid grid-cols-2 gap-6 text-center"><p className="border-t border-slate-500 pt-1">{settings?.leftSignatureText || "ELABORADO POR"}</p><p className="border-t border-slate-500 pt-1">{settings?.rightSignatureText || "ACEPTADA, FIRMA Y/O SELLO Y FECHA"}</p></div>
      {settings?.footerText ? <p className="mt-5 border-t border-slate-200 pt-3 text-center text-slate-500">{settings.footerText}</p> : null}
    </div>
  </section>;
}

function PreviewLine({ className = "", label, value }: { className?: string; label: string; value: string | null }) {
  return <div className={className}><dt className="font-semibold uppercase text-slate-500">{label}</dt><dd className="whitespace-pre-wrap">{value || "—"}</dd></div>;
}
