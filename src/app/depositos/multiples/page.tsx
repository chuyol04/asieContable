import { createMultipleDepositsAction } from "@/features/bank-deposits/actions";
import { DepositForm } from "@/features/bank-deposits/components/deposit-form";
import { listBankAccountOptions } from "@/features/bank-deposits/service";
import { parseDepositId } from "@/features/bank-deposits/validation";
import { listAccountingPeriods } from "@/features/accounting-periods/service";
import { getCompanyContext } from "@/features/company-context/service";

export default async function MultipleDepositsPage({ searchParams }: PageProps<"/depositos/multiples">) {
  const periodId = parseDepositId((await searchParams).periodId);
  const { activeCompany } = await getCompanyContext();
  if (!activeCompany) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">Selecciona una empresa activa en el encabezado.</div>;
  const [periods, accounts] = await Promise.all([listAccountingPeriods({ search: "", companyId: activeCompany.id, year: null, status: "all" }), listBankAccountOptions(activeCompany.id)]);
  const period = periods.find((item) => item.id === periodId);
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Depósitos / Lote</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Registrar lote de depósitos</h1><p className="mb-6 mt-2 text-sm text-slate-500">Selecciona los datos comunes, pega un monto por línea y confirma la vista previa.</p><DepositForm action={createMultipleDepositsAction} accounts={accounts} companies={[activeCompany]} initialValues={{ companyId: String(activeCompany.id), accountingPeriodId: period ? String(period.id) : "" }} lockCompany mode="multiple" periods={periods} /></div>;
}
