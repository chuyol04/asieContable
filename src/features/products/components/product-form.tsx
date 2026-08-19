"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { ProductFormAction, ProductFormState, ProductFormValues } from "../types";

const emptyValues: ProductFormValues = { sku: "", name: "", description: "", unit: "", unitPrice: "0.00", purchaseCost: "", defaultMarginPercentage: "", taxRate: "", notes: "" };
const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";

export function ProductForm({ action, cancelHref, initialValues = emptyValues, submitLabel }: { action: ProductFormAction; cancelHref: string; initialValues?: ProductFormValues; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, { message: "" } as ProductFormState);
  const values = state.values ?? initialValues;
  return <form action={formAction} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
    <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="text-sm font-semibold text-slate-900">Información del producto</h2><p className="mt-1 text-xs text-slate-500">Estos datos podrán reutilizarse posteriormente en órdenes de compra.</p></div>
    <div className="space-y-5 p-5 sm:p-6">
      {state.message ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{state.message}</p> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Referencia / SKU" maxLength={100} name="sku" value={values.sku} />
        <Field label="Nombre" maxLength={191} name="name" required value={values.name} />
        <Field inputMode="decimal" label="Precio unitario" name="unitPrice" required value={values.unitPrice} />
        <Field label="Unidad" maxLength={64} name="unit" placeholder="PZA, KG, SERVICIO…" required value={values.unit} />
        <Field inputMode="decimal" label="IVA predeterminado (%) — opcional" name="taxRate" value={values.taxRate} />
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">Información administrativa interna</p>
        <p className="mt-1 text-xs leading-5 text-amber-700">El costo tiene prioridad. El margen solo se usa para estimar el costo cuando no se captura uno.</p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <Field inputMode="decimal" label="Costo de compra" name="purchaseCost" value={values.purchaseCost} />
          <Field inputMode="decimal" label="Margen estimado (%)" name="defaultMarginPercentage" value={values.defaultMarginPercentage} />
        </div>
      </div>
      <TextArea label="Descripción" maxLength={10_000} name="description" rows={4} value={values.description} />
      <TextArea label="Observaciones" maxLength={5_000} name="notes" rows={3} value={values.notes} />
    </div>
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      <Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-100" href={cancelHref}>Cancelar</Link>
      <button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">{pending ? "Guardando…" : submitLabel}</button>
    </div>
  </form>;
}

function Field({ inputMode, label, maxLength, name, placeholder, required = false, value }: { inputMode?: "decimal"; label: string; maxLength?: number; name: string; placeholder?: string; required?: boolean; value: string }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}{required ? <span className="text-red-600"> *</span> : null}<input className={inputClass} defaultValue={value} inputMode={inputMode} maxLength={maxLength} name={name} placeholder={placeholder} required={required} /></label>;
}

function TextArea({ label, maxLength, name, rows, value }: { label: string; maxLength: number; name: string; rows: number; value: string }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}<textarea className={inputClass} defaultValue={value} maxLength={maxLength} name={name} rows={rows} /></label>;
}
