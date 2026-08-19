import { listAccountingPeriods } from "@/features/accounting-periods/service";
import { parseDepositId } from "@/features/bank-deposits/validation";
import { createCashDeliveryAction } from "@/features/cash-deliveries/actions";
import { DeliveryForm } from "@/features/cash-deliveries/components/delivery-form";
import { getCompanyContext } from "@/features/company-context/service";

export default async function NewDeliveryPage({ searchParams }: PageProps<"/entregas/nueva">) {
  const periodId = parseDepositId((await searchParams).periodId);
  const { activeCompany } = await getCompanyContext();
  if (!activeCompany) return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Selecciona una empresa activa desde el encabezado.</p>;
  const periods = await listAccountingPeriods({ search: "", companyId: activeCompany.id, year: null, status: "all" });
  const period = periods.find((item) => item.id === periodId);
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Entregas / Nueva</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Registrar entrega de efectivo</h1><p className="mb-6 mt-2 text-sm text-slate-500">Compara el monto guardado contra el monto entregado, de forma independiente a los depósitos bancarios.</p><DeliveryForm action={createCashDeliveryAction} companies={[activeCompany]} initialValues={{ companyId: String(activeCompany.id), accountingPeriodId: period ? String(period.id) : "" }} lockCompany periods={periods} /></div>;
}
