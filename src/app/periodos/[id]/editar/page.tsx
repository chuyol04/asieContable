import { notFound } from "next/navigation";

import { updatePeriodNotesAction } from "@/features/accounting-periods/actions";
import { PeriodNotesForm } from "@/features/accounting-periods/components/period-form";
import { getAccountingPeriod } from "@/features/accounting-periods/service";
import { monthNames, parsePeriodId } from "@/features/accounting-periods/validation";
import { getActiveCompanyId } from "@/features/company-context/service";

export default async function EditPeriodPage({ params }: PageProps<"/periodos/[id]/editar">) {
  const id = parsePeriodId((await params).id);
  if (!id) notFound();
  const [period, activeCompanyId] = await Promise.all([getAccountingPeriod(id), getActiveCompanyId()]);
  if (!period || period.companyId !== activeCompanyId) notFound();

  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Periodos / Editar</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{period.companyName} · {monthNames[period.month - 1]} {period.year}</h1><p className="mb-6 mt-2 text-sm text-slate-500">Actualiza las observaciones del periodo.</p><PeriodNotesForm action={updatePeriodNotesAction.bind(null, period.id, period.companyId)} initialNotes={period.notes ?? ""} periodId={period.id} /></div>;
}
