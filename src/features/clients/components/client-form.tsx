"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { ClientFormAction, ClientFormState, ClientFormValues } from "../types";

const emptyValues: ClientFormValues = { name: "", legalName: "", taxId: "", userEmail: "", phone: "", website: "", notes: "" };
const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";

export function ClientForm({ action, initialValues = emptyValues, submitLabel }: { action: ClientFormAction; initialValues?: ClientFormValues; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, { message: "" } as ClientFormState);
  const values = state.values ?? initialValues;
  return <form action={formAction} className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="space-y-5 p-5 sm:p-6">
      {state.message ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p> : null}
      <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">El correo debe existir primero en Firebase Authentication. El UID se asociará automáticamente.</div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" maxLength={191} name="name" required value={values.name} />
        <Field label="Correo del usuario" maxLength={191} name="userEmail" required type="email" value={values.userEmail} />
        <Field label="Razón social" maxLength={255} name="legalName" value={values.legalName} />
        <Field label="RFC" maxLength={32} name="taxId" value={values.taxId} />
        <Field label="Teléfono" maxLength={32} name="phone" type="tel" value={values.phone} />
        <Field label="Página web" maxLength={500} name="website" placeholder="https://" type="url" value={values.website} />
      </div>
      <label className="block text-xs font-semibold text-slate-600">Observaciones<textarea className={inputClass} defaultValue={values.notes} maxLength={5_000} name="notes" rows={4} /></label>
    </div>
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end">
      <Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600" href="/clientes">Cancelar</Link>
      <button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Guardando…" : submitLabel}</button>
    </div>
  </form>;
}

function Field({ label, maxLength, name, placeholder, required = false, type = "text", value }: { label: string; maxLength: number; name: string; placeholder?: string; required?: boolean; type?: string; value: string }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}{required ? <span className="text-red-600"> *</span> : null}<input className={inputClass} defaultValue={value} maxLength={maxLength} name={name} placeholder={placeholder} required={required} type={type} /></label>;
}
