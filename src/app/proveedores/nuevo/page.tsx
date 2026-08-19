import { getCompanyContext } from "@/features/company-context/service";
import { createSupplierAction } from "@/features/suppliers/actions";
import { SupplierForm } from "@/features/suppliers/components/supplier-form";

export default async function NewSupplierPage() {
  const { activeCompany: company } = await getCompanyContext();
  if (!company) return <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Selecciona una empresa activa desde el encabezado.</div>;
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">{company.name} / Proveedores</p><h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Nuevo proveedor</h1><p className="mt-2 text-sm text-slate-500">Estos datos podrán autocompletarse en cada orden.</p><SupplierForm action={createSupplierAction.bind(null, company.id)} cancelHref="/proveedores" submitLabel="Guardar proveedor" /></div>;
}
