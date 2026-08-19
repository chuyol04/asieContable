import { createPeriodAction } from "@/features/accounting-periods/actions";
import { PeriodForm } from "@/features/accounting-periods/components/period-form";
import { getCompanyContext } from "@/features/company-context/service";

export default async function NewPeriodPage() {
  const { activeCompany } = await getCompanyContext();
  if (!activeCompany) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">Selecciona una empresa activa en el encabezado.</div>;

  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Periodos / Nuevo</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Crear periodo mensual</h1><p className="mb-6 mt-2 text-sm text-slate-500">El periodo iniciará con estado abierto.</p><PeriodForm action={createPeriodAction} companies={[activeCompany]} initialValues={{ companyId: String(activeCompany.id) }} lockCompany /></div>;
}
