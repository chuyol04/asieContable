"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { Company } from "@/features/companies/types";
import type { PeriodFormAction, PeriodFormState, PeriodFormValues } from "../types";
import { monthNames } from "../validation";

const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";

export function PeriodForm({ action, companies, initialValues, lockCompany = false }: { action: PeriodFormAction; companies: Company[]; initialValues?: Partial<PeriodFormValues>; lockCompany?: boolean }) {
  const defaults: PeriodFormValues = { companyId: initialValues?.companyId ?? "", month: initialValues?.month ?? String(new Date().getMonth() + 1), year: initialValues?.year ?? String(new Date().getFullYear()), notes: initialValues?.notes ?? "" };
  const [state, formAction, pending] = useActionState(action, { message: "" } as PeriodFormState);
  const values = state.values ?? defaults;

  return <PeriodFormShell action={formAction} cancelHref="/periodos" message={state.message} pending={pending} submitLabel="Crear periodo">
    <div className="grid gap-5 md:grid-cols-3">
      {lockCompany ? <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-3"><p className="text-xs font-semibold text-slate-500">Empresa activa</p><p className="mt-1 text-sm font-semibold text-slate-900">{companies[0]?.name}</p><input name="companyId" type="hidden" value={values.companyId} /></div> : <label className="text-xs font-semibold text-slate-600 md:col-span-3">Empresa <span className="text-red-600">*</span><select className={inputClass} defaultValue={values.companyId} name="companyId" required><option disabled value="">Selecciona una empresa</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>}
      <label className="text-xs font-semibold text-slate-600">Mes <span className="text-red-600">*</span>
        <select className={inputClass} defaultValue={values.month} name="month" required>{monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select>
      </label>
      <label className="text-xs font-semibold text-slate-600">Año <span className="text-red-600">*</span>
        <input className={inputClass} defaultValue={values.year} max={2200} min={1900} name="year" required type="number" />
      </label>
      <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3"><p className="text-xs font-semibold text-cyan-700">Estado inicial</p><p className="mt-1 text-sm font-medium text-slate-800">Abierto</p></div>
    </div>
    <NotesField value={values.notes} />
  </PeriodFormShell>;
}

export function PeriodNotesForm({ action, initialNotes, periodId }: { action: PeriodFormAction; initialNotes: string; periodId: number }) {
  const [state, formAction, pending] = useActionState(action, { message: "" } as PeriodFormState);
  return <PeriodFormShell action={formAction} cancelHref={`/periodos/${periodId}`} message={state.message} pending={pending} submitLabel="Guardar cambios"><NotesField value={state.values?.notes ?? initialNotes} /></PeriodFormShell>;
}

function NotesField({ value }: { value: string }) {
  return <label className="block text-xs font-semibold text-slate-600">Observaciones<textarea className={inputClass} defaultValue={value} maxLength={5_000} name="notes" rows={6} /></label>;
}

function PeriodFormShell({ action, cancelHref, children, message, pending, submitLabel }: { action: (payload: FormData) => void; cancelHref: string; children: React.ReactNode; message: string; pending: boolean; submitLabel: string }) {
  return <form action={action} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40"><div className="space-y-5 p-5 sm:p-6">{message ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{message}</p> : null}{children}</div><div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-100" href={cancelHref}>Cancelar</Link><button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Guardando…" : submitLabel}</button></div></form>;
}
