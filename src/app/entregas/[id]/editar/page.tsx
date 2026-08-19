import { notFound } from "next/navigation";

import { getAccountingPeriod, listAccountingPeriods } from "@/features/accounting-periods/service";
import { updateCashDeliveryAction } from "@/features/cash-deliveries/actions";
import { DeliveryForm } from "@/features/cash-deliveries/components/delivery-form";
import { getCashDelivery } from "@/features/cash-deliveries/service";
import { parseDeliveryId } from "@/features/cash-deliveries/validation";
import { getCompanyContext, validateActiveCompany } from "@/features/company-context/service";

export default async function EditDeliveryPage({ params }: PageProps<"/entregas/[id]/editar">) {
  const id = parseDeliveryId((await params).id); if (!id) notFound();
  const delivery = await getCashDelivery(id); if (!delivery || delivery.status !== "pending_signature") notFound();
  await validateActiveCompany(delivery.companyId);
  const { activeCompany } = await getCompanyContext(); if (!activeCompany) notFound();
  const [period, periods] = await Promise.all([getAccountingPeriod(delivery.accountingPeriodId), listAccountingPeriods({ search: "", companyId: activeCompany.id, year: null, status: "all" })]);
  if (!period || period.status === "closed") notFound();
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Entregas / Editar</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Editar entrega</h1><p className="mb-6 mt-2 text-sm text-slate-500">La empresa y el periodo se conservan; una entrega firmada ya no puede editarse.</p><DeliveryForm action={updateCashDeliveryAction.bind(null, delivery.id)} companies={[activeCompany]} initialValues={{ companyId: String(delivery.companyId), accountingPeriodId: String(delivery.accountingPeriodId), deliveryDate: delivery.deliveryDate, storedAmount: delivery.storedAmount, amount: delivery.amount, deliveredBy: delivery.deliveredBy, receivedBy: delivery.receivedBy, notes: delivery.notes ?? "" }} lockContext periods={periods} /></div>;
}
