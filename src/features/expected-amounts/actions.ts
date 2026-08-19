"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parsePeriodId } from "@/features/accounting-periods/validation";
import { getAccountingPeriod } from "@/features/accounting-periods/service";
import { getActiveCompanyId } from "@/features/company-context/service";
import { deleteExpectedAmountImport, importExpectedAmounts } from "./service";
import type { ExpectedImportState } from "./types";
import { validateExpectedImport } from "./validation";

export async function importExpectedAmountsAction(periodId: number, _state: ExpectedImportState, formData: FormData): Promise<ExpectedImportState> {
  if (!parsePeriodId(periodId)) return { message: "El periodo indicado no es válido." };
  const [period, activeCompanyId] = await Promise.all([getAccountingPeriod(periodId), getActiveCompanyId()]);
  if (!period || period.companyId !== activeCompanyId) return { message: "El periodo no pertenece a la empresa activa." };
  const validation = validateExpectedImport(formData);
  if (!validation.success) return { message: validation.message };

  try {
    await importExpectedAmounts(periodId, validation.sourceName, validation.amountColumn, validation.rows);
  } catch {
    console.error("[expected-amounts] Failed to import rows.");
    return { message: "No fue posible guardar los montos esperados." };
  }
  revalidatePath(`/periodos/${periodId}`);
  revalidatePath(`/periodos/${periodId}/montos-esperados`);
  redirect(`/periodos/${periodId}/montos-esperados?message=imported`);
}

export async function deleteExpectedAmountImportAction(formData: FormData): Promise<void> {
  const periodId = parsePeriodId(formData.get("periodId"));
  const importId = parsePeriodId(formData.get("importId"));
  if (!periodId || !importId) redirect("/periodos?error=invalid-period");
  const [period, activeCompanyId] = await Promise.all([getAccountingPeriod(periodId), getActiveCompanyId()]);
  if (!period || period.companyId !== activeCompanyId) redirect("/periodos?error=invalid-period");
  let result: Awaited<ReturnType<typeof deleteExpectedAmountImport>>;
  try {
    result = await deleteExpectedAmountImport(periodId, importId);
  } catch {
    console.error("[expected-amounts] Failed to delete import.");
    redirect(`/periodos/${periodId}/montos-esperados?error=delete-failed`);
  }
  if (result === "reconciled") redirect(`/periodos/${periodId}/montos-esperados?error=import-reconciled`);
  if (result === "not-found") redirect(`/periodos/${periodId}/montos-esperados?error=import-not-found`);
  revalidatePath(`/periodos/${periodId}`);
  revalidatePath(`/periodos/${periodId}/montos-esperados`);
  revalidatePath("/periodos");
  redirect(`/periodos/${periodId}/montos-esperados?message=deleted`);
}
