import { notFound } from "next/navigation";

import { getAccountingPeriod } from "@/features/accounting-periods/service";
import { monthNames, parsePeriodId } from "@/features/accounting-periods/validation";
import { importExpectedAmountsAction } from "@/features/expected-amounts/actions";
import { ExcelImporter } from "@/features/expected-amounts/components/excel-importer";
import { getActiveCompanyId } from "@/features/company-context/service";

export default async function ImportExpectedAmountsPage({ params }: PageProps<"/periodos/[id]/montos-esperados/importar">) {
  const id = parsePeriodId((await params).id);
  if (!id) notFound();
  const [period, activeCompanyId] = await Promise.all([getAccountingPeriod(id), getActiveCompanyId()]);
  if (!period || period.companyId !== activeCompanyId) notFound();
  return <div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Periodos / Montos esperados / Importar</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Importar Excel</h1><p className="mb-6 mt-2 text-sm text-slate-500">{period.companyName} · {monthNames[period.month - 1]} {period.year}</p><ExcelImporter action={importExpectedAmountsAction.bind(null, period.id)} periodId={period.id} /></div>;
}
