"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createDeposits, depositErrorCode, getDeposit, updateDeposit } from "./service";
import type { DepositFormState } from "./types";
import { parseDepositId, validateDepositForm } from "./validation";
import { validateActiveCompany } from "@/features/company-context/service";

const errors: Record<string, string> = {
  INVALID_CONTEXT: "La cuenta y el periodo deben pertenecer a la empresa seleccionada.",
  INVALID_BATCH_CONTEXT: "La empresa, periodo, cuenta y fecha de un depósito por lote no pueden cambiarse.",
  PERIOD_CLOSED: "No se pueden registrar depósitos en un periodo cerrado.",
  DEPOSIT_RECONCILED: "El depósito ya está conciliado y no puede editarse.",
  DEPOSIT_NOT_FOUND: "El depósito indicado no existe.",
  DUPLICATE_REFERENCE: "Ya existe un depósito con esa referencia en la misma cuenta. Verifica antes de continuar.",
};

async function saveNew(multiple: boolean, formData: FormData): Promise<DepositFormState> {
  const validation = validateDepositForm(formData, multiple);
  if (!validation.success) return { message: validation.message, values: validation.values };
  try { await validateActiveCompany(validation.data.companyId); } catch { return { message: "La empresa no coincide con el contexto activo." }; }
  try {
    await createDeposits(validation.data, validation.amounts, multiple);
  } catch (error) {
    console.error("[bank-deposits] Failed to create deposits.");
    return { message: errors[depositErrorCode(error) ?? ""] ?? "No fue posible guardar los depósitos.", values: formValues(validation.data, multiple ? "" : validation.amounts[0], multiple ? formData.get("amounts") : "") };
  }
  revalidateDepositPaths(validation.data.accountingPeriodId);
  redirect(`/depositos?periodId=${validation.data.accountingPeriodId}&message=${multiple ? "multiple-created" : "created"}`);
}

export async function createDepositAction(_state: DepositFormState, formData: FormData): Promise<DepositFormState> {
  return saveNew(false, formData);
}

export async function createMultipleDepositsAction(_state: DepositFormState, formData: FormData): Promise<DepositFormState> {
  return saveNew(true, formData);
}

export async function updateDepositAction(id: number, _state: DepositFormState, formData: FormData): Promise<DepositFormState> {
  if (!parseDepositId(id)) return { message: "El depósito indicado no es válido." };
  const current = await getDeposit(id);
  if (!current) return { message: "El depósito indicado no existe." };
  try { await validateActiveCompany(current.companyId); } catch { return { message: "El depósito no pertenece a la empresa activa." }; }
  const validation = validateDepositForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };
  try { await validateActiveCompany(validation.data.companyId); } catch { return { message: "La empresa no coincide con el contexto activo." }; }
  try {
    await updateDeposit(id, validation.data, validation.amounts[0]);
  } catch (error) {
    console.error("[bank-deposits] Failed to update deposit.");
    return { message: errors[depositErrorCode(error) ?? ""] ?? "No fue posible actualizar el depósito.", values: formValues(validation.data, validation.amounts[0], "") };
  }
  revalidateDepositPaths(validation.data.accountingPeriodId);
  revalidatePath(`/depositos/${id}`);
  redirect(`/depositos/${id}?message=updated`);
}

function revalidateDepositPaths(periodId: number) {
  revalidatePath("/depositos");
  revalidatePath(`/periodos/${periodId}`);
}

function formValues(input: Parameters<typeof createDeposits>[0], amount: string, amounts: FormDataEntryValue | null) {
  return { companyId: String(input.companyId), accountingPeriodId: String(input.accountingPeriodId), bankAccountId: String(input.bankAccountId), amount, amounts: typeof amounts === "string" ? amounts : "", depositDate: input.depositDate, reference: input.reference ?? "", notes: input.notes ?? "" };
}
