"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { BankFormAction, BankFormState, BankFormValues } from "../types";

const emptyValues: BankFormValues = { name: "", shortName: "" };

export function BankForm({
  action,
  initialValues = emptyValues,
  submitLabel,
}: {
  action: BankFormAction;
  initialValues?: BankFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { message: "" } as BankFormState);
  const values = state.values ?? initialValues;
  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";

  return (
    <form action={formAction} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-slate-900">Información general</h2>
        <p className="mt-1 text-xs text-slate-500">El nombre corto es opcional.</p>
      </div>
      <div className="space-y-5 p-5 sm:p-6">
        {state.message ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}
        <label className="block text-xs font-semibold text-slate-600">
          Nombre <span className="text-red-600">*</span>
          <input className={inputClass} defaultValue={values.name} maxLength={191} name="name" required />
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Nombre corto
          <input className={inputClass} defaultValue={values.shortName} maxLength={64} name="shortName" />
        </label>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-100" href="/bancos">Cancelar</Link>
        <button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
