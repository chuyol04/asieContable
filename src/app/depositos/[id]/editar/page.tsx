import { notFound } from "next/navigation";

import { updateDepositAction } from "@/features/bank-deposits/actions";
import { DepositForm } from "@/features/bank-deposits/components/deposit-form";
import { getDeposit, listBankAccountOptions } from "@/features/bank-deposits/service";
import { parseDepositId } from "@/features/bank-deposits/validation";
import { listAccountingPeriods } from "@/features/accounting-periods/service";
import { getCompanyContext, validateActiveCompany } from "@/features/company-context/service";

export default async function EditDepositPage({ params }: PageProps<"/depositos/[id]/editar">) {
  const id = parseDepositId((await params).id);
  if (!id) notFound();
  const deposit = await getDeposit(id);
  if (!deposit || deposit.status !== "available") notFound();
  await validateActiveCompany(deposit.companyId);
  const { activeCompany } = await getCompanyContext();
  if (!activeCompany) notFound();
  const [periods, accounts] = await Promise.all([listAccountingPeriods({ search: "", companyId: activeCompany.id, year: null, status: "all" }), listBankAccountOptions(activeCompany.id)]);
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Depósitos / Editar</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Editar depósito</h1><p className="mb-6 mt-2 text-sm text-slate-500">Sólo los depósitos disponibles pueden modificarse.{deposit.batchId ? " En depósitos por lote se conserva su empresa, periodo, cuenta y fecha." : ""}</p><DepositForm action={updateDepositAction.bind(null, deposit.id)} accounts={accounts} companies={[activeCompany]} initialValues={{ companyId: String(deposit.companyId), accountingPeriodId: String(deposit.accountingPeriodId), bankAccountId: String(deposit.bankAccountId), amount: deposit.amount, depositDate: deposit.depositDate, reference: deposit.reference ?? "", notes: deposit.notes ?? "" }} lockCompany lockContext={deposit.batchId !== null} periods={periods} /></div>;
}
