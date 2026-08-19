"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { SupplierFormAction, SupplierFormState, SupplierFormValues } from "../types";

const emptyValues: SupplierFormValues = { legalName: "", taxId: "", fiscalAddress: "", phone: "" };
const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";

export function SupplierForm({ action, cancelHref, initialValues = emptyValues, submitLabel }: { action: SupplierFormAction; cancelHref: string; initialValues?: SupplierFormValues; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, { message: "" } as SupplierFormState);
  const values = state.values ?? initialValues;
  return <form action={formAction} className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="space-y-5 p-5 sm:p-6">{state.message ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p> : null}<div className="grid gap-5 sm:grid-cols-2"><Field label="Razón social" maxLength={255} name="legalName" required value={values.legalName} /><Field label="RFC" maxLength={32} name="taxId" value={values.taxId} /><Field label="Teléfono" maxLength={32} name="phone" type="tel" value={values.phone} /></div><label className="block text-xs font-semibold text-slate-600">Domicilio fiscal<textarea className={inputClass} defaultValue={values.fiscalAddress} maxLength={5_000} name="fiscalAddress" rows={4} /></label></div><div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end"><Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600" href={cancelHref}>Cancelar</Link><button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Guardando…" : submitLabel}</button></div></form>;
}

function Field({ label, maxLength, name, required = false, type = "text", value }: { label: string; maxLength: number; name: string; required?: boolean; type?: string; value: string }) { return <label className="block text-xs font-semibold text-slate-600">{label}{required ? <span className="text-red-600"> *</span> : null}<input className={inputClass} defaultValue={value} maxLength={maxLength} name={name} required={required} type={type} /></label>; }
