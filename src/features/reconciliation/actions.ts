"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAccountingPeriod } from "@/features/accounting-periods/service";
import { validateActiveCompany } from "@/features/company-context/service";

import { confirmReconciliation, processExactReconciliations, reconciliationErrorCode, undoReconciliation } from "./service";
import { parseMatchType, parseReconciliationId } from "./validation";

export async function processExactReconciliationsAction(formData: FormData): Promise<void> {
  const periodId = parseReconciliationId(formData.get("periodId"));
  if (!periodId) redirect("/conciliacion?error=invalid-request");
  await validatePeriodCompany(periodId);
  let count: number;
  try {
    count = await processExactReconciliations(periodId);
  } catch (error) {
    console.error("[reconciliation] Failed to process exact matches.");
    redirect(`/conciliacion?periodId=${periodId}&error=${reconciliationErrorCode(error) ?? "save-failed"}`);
  }
  revalidate(periodId);
  redirect(`/conciliacion?periodId=${periodId}&message=exact&count=${count}`);
}

export async function confirmReconciliationAction(formData: FormData): Promise<void> {
  const periodId = parseReconciliationId(formData.get("periodId"));
  const expectedAmountId = parseReconciliationId(formData.get("expectedAmountId"));
  const bankDepositId = parseReconciliationId(formData.get("bankDepositId"));
  const matchType = parseMatchType(formData.get("matchType"));
  if (!periodId || !expectedAmountId || !bankDepositId || (matchType !== "similar" && matchType !== "manual")) redirect(`/conciliacion?periodId=${periodId ?? ""}&error=invalid-request`);
  await validatePeriodCompany(periodId);
  let actualPeriodId: number;
  try {
    actualPeriodId = await confirmReconciliation(periodId, expectedAmountId, bankDepositId, matchType);
  } catch (error) {
    console.error("[reconciliation] Failed to confirm match.");
    redirect(`/conciliacion?periodId=${periodId}&error=${reconciliationErrorCode(error) ?? "save-failed"}`);
  }
  revalidate(actualPeriodId);
  redirect(`/conciliacion?periodId=${actualPeriodId}&message=confirmed`);
}

export async function undoReconciliationAction(formData: FormData): Promise<void> {
  const periodId = parseReconciliationId(formData.get("periodId"));
  const reconciliationId = parseReconciliationId(formData.get("reconciliationId"));
  if (!periodId || !reconciliationId) redirect(`/conciliacion?periodId=${periodId ?? ""}&error=invalid-request`);
  await validatePeriodCompany(periodId);
  let actualPeriodId: number;
  try {
    actualPeriodId = await undoReconciliation(periodId, reconciliationId);
  } catch (error) {
    console.error("[reconciliation] Failed to undo match.");
    redirect(`/conciliacion?periodId=${periodId}&error=${reconciliationErrorCode(error) ?? "save-failed"}`);
  }
  revalidate(actualPeriodId);
  redirect(`/conciliacion?periodId=${actualPeriodId}&message=undone`);
}

function revalidate(periodId: number) {
  revalidatePath("/conciliacion");
  revalidatePath("/depositos");
  revalidatePath(`/periodos/${periodId}`);
  revalidatePath(`/periodos/${periodId}/montos-esperados`);
}

async function validatePeriodCompany(periodId: number): Promise<void> {
  const period = await getAccountingPeriod(periodId);
  if (!period) redirect("/conciliacion?error=invalid-request");
  await validateActiveCompany(period.companyId);
}
