import { notFound } from "next/navigation";

import { getCompany } from "@/features/companies/service";
import { parseCompanyId } from "@/features/companies/validation";
import { createProductAction } from "@/features/products/actions";
import { ProductForm } from "@/features/products/components/product-form";
import { validateActiveCompany } from "@/features/company-context/service";

export default async function NewProductPage({ params }: PageProps<"/empresas/[id]/productos/nuevo">) {
  const { id: rawId } = await params;
  const companyId = parseCompanyId(rawId);
  if (!companyId) notFound();
  await validateActiveCompany(companyId);
  const company = await getCompany(companyId);
  if (!company) notFound();

  return <div className="mx-auto max-w-3xl">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">{company.name} / Productos</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Nuevo producto</h1>
    <p className="mb-6 mt-2 text-sm text-slate-500">Agrega un producto al catálogo exclusivo de esta empresa.</p>
    <ProductForm action={createProductAction.bind(null, companyId)} cancelHref={`/empresas/${companyId}?tab=productos`} submitLabel="Guardar producto" />
  </div>;
}
