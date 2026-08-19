import Link from "next/link";

import { getCompanyContext } from "@/features/company-context/service";

export default async function PurchaseOrderTemplatesPage() {
  const { activeCompany: company } = await getCompanyContext();
  return <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Compras / Configuración</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Plantilla de órdenes</h1><p className="mt-2 text-sm text-slate-500">La empresa activa conserva su logo, numeración, impuestos, textos y firmas.</p>{company ? <article className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-950">{company.name}</h2><p className="mt-1 text-sm text-slate-500">{company.legalName ?? "Sin razón social configurada"}</p><div className="mt-5 flex flex-wrap gap-2"><Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white" href={`/empresas/${company.id}/configuracion-ordenes`}>Configurar plantilla</Link><Link className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600" href="/ordenes-compra/nueva">Crear orden</Link></div></article> : <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Selecciona una empresa activa desde el encabezado.</p>}</div>;
}
