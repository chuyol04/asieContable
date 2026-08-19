import Link from "next/link";
import { notFound } from "next/navigation";

import { getCompany } from "@/features/companies/service";
import { getActiveCompanyId } from "@/features/company-context/service";
import { listProducts } from "@/features/products/service";
import { getPurchaseOrderSettings } from "@/features/purchase-order-settings/service";
import { formatNextOrderNumber } from "@/features/purchase-order-settings/validation";
import { createPurchaseOrderAction } from "@/features/purchase-orders/actions";
import { PurchaseOrderForm } from "@/features/purchase-orders/components/purchase-order-form";
import { listSuppliers } from "@/features/suppliers/service";

export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage() {
  const companyId = await getActiveCompanyId();
  if (!companyId) {
    return <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Selecciona una empresa activa desde el encabezado.</div>;
  }

  const [company, settings, products, suppliers] = await Promise.all([getCompany(companyId), getPurchaseOrderSettings(companyId), listProducts(companyId, "", "active"), listSuppliers(companyId)]);
  if (!company) notFound();
  if (!settings) return <MissingSetup companyId={companyId} companyName={company.name} kind="configuración de órdenes" href={`/empresas/${companyId}/configuracion-ordenes`} />;
  if (!products.length) return <MissingSetup companyId={companyId} companyName={company.name} kind="productos activos" href={`/empresas/${companyId}?tab=productos`} />;
  const today = mexicoDate();
  return <div><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">{company.name} / Órdenes</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Nueva orden de compra</h1><p className="mt-2 text-sm text-slate-500">Folio propuesto: <span className="font-semibold text-slate-700">{formatNextOrderNumber(settings.orderPrefix, settings.nextOrderNumber)}</span>. Se reservará al guardar.</p><div className="mt-4 flex justify-end"><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700" href={`/empresas/${companyId}/configuracion-ordenes`}>Editar plantilla</Link></div></div><PurchaseOrderForm action={createPurchaseOrderAction.bind(null, companyId)} cancelHref="/ordenes-compra" companyName={company.name} initialValues={{ orderDate: today, deliveryDate: today, supplierLegalName: "", supplierTaxId: "", supplierAddress: "", supplierPhone: "", notes: settings.defaultNotes ?? "" }} orderNumber={formatNextOrderNumber(settings.orderPrefix, settings.nextOrderNumber)} products={products} submitLabel="Guardar borrador" supplierCreateHref="/proveedores/nuevo" suppliers={suppliers} /></div>;
}

function MissingSetup({ companyName, href, kind }: { companyId: number; companyName: string; href: string; kind: string }) { return <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold text-amber-900">Faltan {kind}</h1><p className="mt-2 text-sm text-amber-800">{companyName} necesita completar este dato antes de crear una orden.</p><div className="mt-5 flex flex-wrap gap-3"><Link className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white" href={href}>Completar ahora</Link><Link className="rounded-lg border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-800" href="/ordenes-compra/nueva">Elegir otra empresa</Link></div></div>; }
function mexicoDate(): string { const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const value = Object.fromEntries(parts.map((part) => [part.type, part.value])); return `${value.year}-${value.month}-${value.day}`; }
