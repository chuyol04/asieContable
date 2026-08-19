import { createCompanyAction } from "@/features/companies/actions";
import { CompanyForm } from "@/features/companies/components/company-form";

export default function NewCompanyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Empresas / Nueva</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Nueva empresa</h1>
      <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">Registra los datos generales. El nombre es obligatorio.</p>
      <CompanyForm action={createCompanyAction} submitLabel="Crear empresa" />
    </div>
  );
}
