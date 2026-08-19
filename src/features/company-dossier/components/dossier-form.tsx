"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { Bank } from "@/features/banks/types";
import type { CompanyRepresentative, DossierFormAction, DossierFormState, DossierFormValues, DossierSection } from "../types";
import { documentTypes } from "../validation";

const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";

export function DossierForm({
  action,
  banks = [],
  cancelHref,
  initialValues = {},
  representatives = [],
  section,
  submitLabel,
}: {
  action: DossierFormAction;
  banks?: Bank[];
  cancelHref: string;
  initialValues?: DossierFormValues;
  representatives?: CompanyRepresentative[];
  section: DossierSection;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { message: "" } as DossierFormState);
  const values = state.values ?? initialValues;

  return (
    <form action={formAction} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
      <div className="space-y-5 p-5 sm:p-6">
        {state.message ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p> : null}
        {section === "representantes" ? <RepresentativeFields values={values} /> : null}
        {section === "documentos" ? <DocumentFields representatives={representatives} values={values} /> : null}
        {section === "cuentas" ? <AccountFields banks={banks} values={values} /> : null}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-100" href={cancelHref}>Cancelar</Link>
        <button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function RepresentativeFields({ values }: { values: DossierFormValues }) {
  return <>
    <Field label="Nombre completo" name="fullName" required value={values.fullName} />
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="Cargo" name="position" required value={values.position} />
      <Field label="RFC" maxLength={32} name="taxId" value={values.taxId} />
      <Field label="CURP" maxLength={32} name="curp" value={values.curp} />
      <Field label="Correo" name="email" type="email" value={values.email} />
      <Field label="Teléfono" name="phone" type="tel" value={values.phone} />
    </div>
    <TextArea label="Observaciones" value={values.observations} />
  </>;
}

function DocumentFields({ representatives, values }: { representatives: CompanyRepresentative[]; values: DossierFormValues }) {
  return <>
    <div className="grid gap-5 md:grid-cols-2">
      <label className="text-xs font-semibold text-slate-600">Tipo de documento <span className="text-red-600">*</span>
        <select className={inputClass} defaultValue={values.documentType ?? "acta_constitutiva"} name="documentType" required>
          {documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </label>
      <Field label="Nombre" name="documentName" required value={values.documentName} />
      <Field label="Fecha de emisión" name="documentDate" type="date" value={values.documentDate} />
      <Field label="Fecha de vencimiento" name="expirationDate" type="date" value={values.expirationDate} />
      <label className="text-xs font-semibold text-slate-600 md:col-span-2">Representante relacionado
        <select className={inputClass} defaultValue={values.representativeId ?? ""} name="representativeId"><option value="">No aplica</option>{representatives.map((representative) => <option key={representative.id} value={representative.id}>{representative.fullName} · {representative.position}</option>)}</select>
      </label>
    </div>
    <label className="block text-xs font-semibold text-slate-600">Archivo
      <input accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" className={inputClass} name="documentFile" type="file" />
      <span className="mt-1 block font-normal text-slate-400">{values.currentFileName ? `Actual: ${values.currentFileName}. Selecciona otro para reemplazarlo.` : "PDF máximo 20 MB; otros archivos máximo 15 MB. No se permiten archivos .key."}</span>
    </label>
    <Field label="URL o referencia externa" name="externalUrl" type="url" value={values.externalUrl} />
    <p className="-mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Nunca cargues contraseñas del SAT, contraseñas de e.firma/FIEL ni llaves privadas.</p>
    <TextArea label="Observaciones" value={values.observations} />
  </>;
}

function AccountFields({ banks, values }: { banks: Bank[]; values: DossierFormValues }) {
  return <>
    <div className="grid gap-5 md:grid-cols-2">
      <label className="text-xs font-semibold text-slate-600">Banco <span className="text-red-600">*</span>
        <select className={inputClass} defaultValue={values.bankId ?? ""} name="bankId" required>
          <option disabled value="">Selecciona un banco</option>
          {banks.map((bank) => <option disabled={!bank.isActive && String(bank.id) !== values.bankId} key={bank.id} value={bank.id}>{bank.name}{bank.isActive ? "" : " (inactivo)"}</option>)}
        </select>
      </label>
      <Field label="Alias" name="alias" required value={values.alias} />
      <Field label="Número de cuenta" name="accountNumber" required value={values.accountNumber} />
      <Field label="CLABE" name="clabe" pattern="[0-9]{18}" required value={values.clabe} />
      <Field label="Sucursal" name="branch" required value={values.branch} />
      <Field label="Plaza" name="plaza" value={values.plaza} />
      <Field label="Moneda" maxLength={3} name="currency" required value={values.currency ?? "MXN"} />
      <Field label="Titular" name="holder" required value={values.holder} />
    </div>
    <TextArea label="Observaciones" value={values.observations} />
  </>;
}

function Field({ label, name, value, required = false, type = "text", maxLength, pattern }: { label: string; name: string; value?: string; required?: boolean; type?: string; maxLength?: number; pattern?: string }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}{required ? <span className="text-red-600"> *</span> : null}
    <input className={inputClass} defaultValue={value} maxLength={maxLength} name={name} pattern={pattern} required={required} type={type} />
  </label>;
}

function TextArea({ label, value }: { label: string; value?: string }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}
    <textarea className={inputClass} defaultValue={value} maxLength={5_000} name="observations" rows={4} />
  </label>;
}
