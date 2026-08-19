import { notFound } from "next/navigation";

import { getCompany } from "@/features/companies/service";
import { parseCompanyId } from "@/features/companies/validation";
import { updateProductAction } from "@/features/products/actions";
import { ProductForm } from "@/features/products/components/product-form";
import { getProduct } from "@/features/products/service";
import { parseProductId } from "@/features/products/validation";
import { validateActiveCompany } from "@/features/company-context/service";

export default async function EditProductPage({ params }: PageProps<"/empresas/[id]/productos/[productId]/editar">) {
  const route = await params;
  const companyId = parseCompanyId(route.id);
  const productId = parseProductId(route.productId);
  if (!companyId || !productId) notFound();
  await validateActiveCompany(companyId);
  const [company, product] = await Promise.all([getCompany(companyId), getProduct(companyId, productId)]);
  if (!company || !product) notFound();

  return <div className="mx-auto max-w-3xl">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">{company.name} / Productos</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Editar producto</h1>
    <p className="mb-6 mt-2 text-sm text-slate-500">Actualiza la información sin perder el registro.</p>
    <ProductForm action={updateProductAction.bind(null, companyId, productId)} cancelHref={`/empresas/${companyId}/productos/${productId}`} initialValues={{ sku: product.sku ?? "", name: product.name, description: product.description, unit: product.unit, unitPrice: product.unitPrice, purchaseCost: product.purchaseCost ?? "", defaultMarginPercentage: product.defaultMarginPercentage ?? "", taxRate: product.taxRate ?? "", notes: product.notes ?? "" }} submitLabel="Guardar cambios" />
  </div>;
}
