"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import type { ReactNode } from "react";

import type { PurchaseOrderSettingsFormAction, PurchaseOrderSettingsFormState, PurchaseOrderSettingsFormValues } from "../types";

const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";

export function PurchaseOrderSettingsForm({ action, companyId, hasLogo, initialValues }: { action: PurchaseOrderSettingsFormAction; companyId: number; hasLogo: boolean; initialValues: PurchaseOrderSettingsFormValues }) {
  const [state, formAction, pending] = useActionState(action, { message: "" } as PurchaseOrderSettingsFormState);
  const values = state.values ?? initialValues;

  return <form action={formAction} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <Section title="Datos de la empresa" description="Se guardan en el expediente y se reutilizarán en las órdenes.">
      <div className="grid gap-5 md:grid-cols-2"><Field label="Nombre comercial" maxLength={191} name="companyName" required value={values.companyName} /><Field label="Razón social" maxLength={255} name="legalName" value={values.legalName} /><Field label="RFC" maxLength={32} name="taxId" value={values.taxId} /><Field label="Teléfono" maxLength={32} name="phone" type="tel" value={values.phone} /><Field label="Correo" maxLength={191} name="email" type="email" value={values.email} /></div>
      <TextArea label="Dirección" name="fiscalAddress" value={values.fiscalAddress} />
    </Section>
    <Section title="Identidad de la orden" description="El archivo se conserva fuera de MySQL; sólo se guarda su referencia.">
      {hasLogo ? <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"><Image alt="Logo actual para órdenes" className="h-16 w-32 object-contain" height={64} src={`/api/empresas/${companyId}/ordenes/logo`} unoptimized width={128} /><label className="flex items-center gap-2 text-sm text-slate-600"><input name="removeLogo" type="checkbox" value="true" /> Quitar logo actual</label></div> : null}
      <label className="block text-xs font-semibold text-slate-600">{hasLogo ? "Reemplazar logo" : "Logo"}<input accept="image/png,image/jpeg,image/webp" className={inputClass} name="logo" type="file" /></label>
      <p className="-mt-3 text-xs text-slate-400">PNG, JPG o WebP; máximo 2 MB.</p>
      <TextArea label="Texto adicional de encabezado" name="headerText" value={values.headerText} />
    </Section>
    <Section title="Numeración e impuestos" description="Guardar no consume el siguiente número; se reservará cuando exista una orden real.">
      <div className="grid gap-5 md:grid-cols-3"><Field label="Prefijo / serie" maxLength={20} name="orderPrefix" placeholder="OC" value={values.orderPrefix} /><Field inputMode="numeric" label="Siguiente número" name="nextOrderNumber" required value={values.nextOrderNumber} /><Field inputMode="decimal" label="IVA predeterminado (%)" name="defaultTaxRate" required value={values.defaultTaxRate} /></div>
    </Section>
    <Section title="Firmas y pie" description="Textos que se colocarán en la plantilla de la orden.">
      <div className="grid gap-5 md:grid-cols-2"><Field label="Firma izquierda" maxLength={191} name="leftSignatureText" value={values.leftSignatureText} /><Field label="Firma derecha" maxLength={191} name="rightSignatureText" value={values.rightSignatureText} /></div>
      <TextArea label="Texto de pie de página" name="footerText" value={values.footerText} /><TextArea label="Observaciones predeterminadas" name="defaultNotes" value={values.defaultNotes} />
    </Section>
    {state.message ? <p className="mx-5 mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6" role="alert">{state.message}</p> : null}
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-100" href={`/empresas/${companyId}?tab=ordenes`}>Cancelar</Link><button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">{pending ? "Guardando…" : "Guardar configuración"}</button></div>
  </form>;
}

function Section({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return <section className="space-y-5 border-b border-slate-100 p-5 sm:p-6"><div><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{description}</p></div>{children}</section>;
}

function Field({ inputMode, label, maxLength, name, placeholder, required = false, type = "text", value }: { inputMode?: "decimal" | "numeric"; label: string; maxLength?: number; name: string; placeholder?: string; required?: boolean; type?: string; value: string }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}{required ? <span className="text-red-600"> *</span> : null}<input className={inputClass} defaultValue={value} inputMode={inputMode} maxLength={maxLength} name={name} placeholder={placeholder} required={required} type={type} /></label>;
}

function TextArea({ label, name, value }: { label: string; name: string; value: string }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}<textarea className={inputClass} defaultValue={value} maxLength={5_000} name={name} rows={3} /></label>;
}
