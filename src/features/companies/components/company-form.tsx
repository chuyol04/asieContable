"use client";

import Link from "next/link";
import { useActionState } from "react";

import type {
  CompanyFormAction,
  CompanyFormState,
  CompanyFormValues,
} from "../types";

const emptyValues: CompanyFormValues = {
  name: "",
  legalName: "",
  taxId: "",
  fiscalAddress: "",
  phones: "",
  emails: "",
  website: "",
  incorporationDate: "",
  notary: "",
  deedNumber: "",
  observations: "",
};

export function CompanyForm({
  action,
  initialValues = emptyValues,
  submitLabel,
}: {
  action: CompanyFormAction;
  initialValues?: CompanyFormValues;
  submitLabel: string;
}) {
  const initialState: CompanyFormState = { message: "" };
  const [state, formAction, pending] = useActionState(action, initialState);
  const values = state.values ?? initialValues;
  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";

  return (
    <form action={formAction} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-slate-900">Información general</h2>
        <p className="mt-1 text-xs text-slate-500">Los campos opcionales pueden completarse posteriormente.</p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {state.message ? (
          <p id="form-error" role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}

        <label className="block text-xs font-semibold text-slate-600">
          Nombre comercial <span className="text-red-600">*</span>
          <input className={inputClass} defaultValue={values.name} maxLength={191} name="name" required />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-600">
            Razón social
            <input className={inputClass} defaultValue={values.legalName} maxLength={255} name="legalName" />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            RFC
            <input className={inputClass} defaultValue={values.taxId} maxLength={32} name="taxId" />
          </label>
        </div>

        <label className="block text-xs font-semibold text-slate-600">
          Domicilio fiscal
          <textarea className={inputClass} defaultValue={values.fiscalAddress} maxLength={5_000} name="fiscalAddress" rows={3} />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-600">Teléfonos
            <textarea className={inputClass} defaultValue={values.phones} name="phones" placeholder={"81 1234 5678\n81 9876 5432"} rows={3} />
            <span className="mt-1 block font-normal text-slate-400">Un teléfono por línea.</span>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Correos
            <textarea className={inputClass} defaultValue={values.emails} name="emails" placeholder={"administracion@empresa.com\ncontabilidad@empresa.com"} rows={3} />
            <span className="mt-1 block font-normal text-slate-400">Un correo por línea.</span>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Página web
            <input className={inputClass} defaultValue={values.website} maxLength={255} name="website" placeholder="https://" type="url" />
          </label>
          <label className="block text-xs font-semibold text-slate-600">Fecha de constitución
            <input className={inputClass} defaultValue={values.incorporationDate} name="incorporationDate" type="date" />
          </label>
          <label className="block text-xs font-semibold text-slate-600">Notaría
            <input className={inputClass} defaultValue={values.notary} maxLength={191} name="notary" />
          </label>
          <label className="block text-xs font-semibold text-slate-600">Número de escritura
            <input className={inputClass} defaultValue={values.deedNumber} maxLength={100} name="deedNumber" />
          </label>
        </div>

        <label className="block text-xs font-semibold text-slate-600">Observaciones
          <textarea className={inputClass} defaultValue={values.observations} maxLength={5_000} name="observations" rows={4} />
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-100" href="/empresas">
          Cancelar
        </Link>
        <button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
