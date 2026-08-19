import Link from "next/link";
import { notFound } from "next/navigation";

import { getCompany } from "@/features/companies/service";
import { parseCompanyId } from "@/features/companies/validation";
import { savePurchaseOrderSettingsAction } from "@/features/purchase-order-settings/actions";
import { PurchaseOrderPreview } from "@/features/purchase-order-settings/components/order-preview";
import { PurchaseOrderSettingsForm } from "@/features/purchase-order-settings/components/settings-form";
import { getPurchaseOrderSettings } from "@/features/purchase-order-settings/service";
import { validateActiveCompany } from "@/features/company-context/service";

export const dynamic = "force-dynamic";

export default async function PurchaseOrderSettingsPage({ params, searchParams }: PageProps<"/empresas/[id]/configuracion-ordenes">) {
  const { id: rawId } = await params;
  const companyId = parseCompanyId(rawId);
  if (!companyId) notFound();
  await validateActiveCompany(companyId);
  const [company, settings] = await Promise.all([getCompany(companyId), getPurchaseOrderSettings(companyId)]);
  if (!company) notFound();
  const query = await searchParams;

  const initialValues = {
    companyName: company.name,
    legalName: company.legalName ?? "",
    taxId: company.taxId ?? "",
    phone: company.phone ?? "",
    email: company.email ?? "",
    fiscalAddress: company.fiscalAddress ?? "",
    orderPrefix: settings?.orderPrefix ?? "",
    nextOrderNumber: String(settings?.nextOrderNumber ?? 1),
    defaultTaxRate: settings?.defaultTaxRate ?? "16.00",
    headerText: settings?.headerText ?? "",
    footerText: settings?.footerText ?? "",
    leftSignatureText: settings?.leftSignatureText ?? "ELABORADO POR",
    rightSignatureText: settings?.rightSignatureText ?? "ACEPTADA, FIRMA Y/O SELLO Y FECHA",
    defaultNotes: settings?.defaultNotes ?? "",
  };

  return <div className="mx-auto max-w-6xl">
    {query.message === "saved" ? <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">La configuración se guardó correctamente.</p> : null}
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">{company.name} / Expediente</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Configuración de órdenes</h1><p className="mt-2 text-sm text-slate-500">Define la identidad, numeración y textos que se reutilizarán en futuras órdenes de compra.</p></div><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50" href={`/empresas/${companyId}?tab=ordenes`}>Volver al expediente</Link></div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]"><PurchaseOrderSettingsForm action={savePurchaseOrderSettingsAction.bind(null, companyId)} companyId={companyId} hasLogo={Boolean(settings?.logoUrl)} initialValues={initialValues} /><div className="xl:sticky xl:top-6"><PurchaseOrderPreview company={company} settings={settings} /></div></div>
  </div>;
}
