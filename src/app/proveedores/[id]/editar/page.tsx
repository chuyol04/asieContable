import { notFound } from "next/navigation";

import { getCompany } from "@/features/companies/service";
import { updateSupplierAction } from "@/features/suppliers/actions";
import { SupplierForm } from "@/features/suppliers/components/supplier-form";
import { getSupplier } from "@/features/suppliers/service";
import { parseSupplierId } from "@/features/suppliers/validation";
import { getActiveCompanyId } from "@/features/company-context/service";

export default async function EditSupplierPage({ params }: PageProps<"/proveedores/[id]/editar">) {
  const route = await params;
  const supplierId = parseSupplierId(route.id);
  const companyId = await getActiveCompanyId();
  if (!supplierId || !companyId) notFound();
  const [supplier, company] = await Promise.all([getSupplier(companyId, supplierId), getCompany(companyId)]);
  if (!supplier || !company) notFound();
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">{company.name} / Proveedores</p><h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Editar proveedor</h1><SupplierForm action={updateSupplierAction.bind(null, companyId, supplierId)} cancelHref={`/proveedores?companyId=${companyId}`} initialValues={{ legalName: supplier.legalName, taxId: supplier.taxId ?? "", fiscalAddress: supplier.fiscalAddress ?? "", phone: supplier.phone ?? "" }} submitLabel="Guardar cambios" /></div>;
}
