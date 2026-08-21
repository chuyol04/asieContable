import { notFound, redirect } from "next/navigation";

import { getActiveCompanyId } from "@/features/company-context/service";
import { getCompany } from "@/features/companies/service";
import { importProductsAction } from "@/features/products/actions";
import { ProductExcelImporter } from "@/features/products/components/product-excel-importer";

export const dynamic = "force-dynamic";

export default async function ImportProductsPage() {
  const companyId = await getActiveCompanyId();
  if (!companyId) redirect("/productos");
  const company = await getCompany(companyId);
  if (!company) notFound();

  return <div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Compras / Productos / Importar</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Carga de productos desde Excel</h1><p className="mb-6 mt-2 text-sm text-slate-500">{company.name} · Carga inicial únicamente por nombre.</p><ProductExcelImporter action={importProductsAction.bind(null, companyId)} /></div>;
}
