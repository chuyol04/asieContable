"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateActiveCompany } from "@/features/company-context/service";

import { cancelCashDelivery, createCashDelivery, deliveryErrorCode, getCashDelivery, saveDeliverySignature, updateCashDelivery } from "./service";
import type { DeliveryFormState, DeliveryInput } from "./types";
import { parseDeliveryId, validateDeliveryForm, validateSignature } from "./validation";

const errors: Record<string, string> = {
  INVALID_CONTEXT: "La empresa y el periodo seleccionados no coinciden.", PERIOD_CLOSED: "No se permiten entregas ni correcciones en un periodo cerrado.", DELIVERY_NOT_FOUND: "La entrega indicada no existe.", DELIVERY_LOCKED: "La entrega ya fue firmada o cancelada y no puede modificarse.",
};

export async function createCashDeliveryAction(_state: DeliveryFormState, formData: FormData): Promise<DeliveryFormState> {
  const validation = validateDeliveryForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };
  await validateActiveCompany(validation.data.companyId);
  let id: number;
  try { id = await createCashDelivery(validation.data); }
  catch (error) { console.error("[cash-deliveries] Failed to create delivery."); return { message: errors[deliveryErrorCode(error) ?? ""] ?? "No fue posible guardar la entrega.", values: formValues(validation.data) }; }
  revalidateDeliveryPaths(validation.data.accountingPeriodId);
  redirect(`/entregas/${id}?message=created`);
}

export async function updateCashDeliveryAction(id: number, _state: DeliveryFormState, formData: FormData): Promise<DeliveryFormState> {
  if (!parseDeliveryId(id)) return { message: "La entrega indicada no es válida." };
  await validateDeliveryCompany(id);
  const validation = validateDeliveryForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };
  await validateActiveCompany(validation.data.companyId);
  try { await updateCashDelivery(id, validation.data); }
  catch (error) { console.error("[cash-deliveries] Failed to update delivery."); return { message: errors[deliveryErrorCode(error) ?? ""] ?? "No fue posible actualizar la entrega.", values: formValues(validation.data) }; }
  revalidateDeliveryPaths(validation.data.accountingPeriodId);
  revalidatePath(`/entregas/${id}`);
  redirect(`/entregas/${id}?message=updated`);
}

export async function cancelCashDeliveryAction(formData: FormData): Promise<void> {
  const id = parseDeliveryId(formData.get("id"));
  const fallbackPeriodId = parseDeliveryId(formData.get("periodId"));
  if (!id) redirect(`/entregas?periodId=${fallbackPeriodId ?? ""}&error=invalid-request`);
  await validateDeliveryCompany(id);
  let periodId: number;
  try { periodId = await cancelCashDelivery(id); }
  catch (error) { console.error("[cash-deliveries] Failed to cancel delivery."); redirect(`/entregas?periodId=${fallbackPeriodId ?? ""}&error=${deliveryErrorCode(error) ?? "save-failed"}`); }
  revalidateDeliveryPaths(periodId);
  revalidatePath(`/entregas/${id}`);
  redirect(`/entregas?periodId=${periodId}&message=cancelled`);
}

export async function saveDeliverySignatureAction(id: number, formData: FormData): Promise<void> {
  if (!parseDeliveryId(id)) redirect("/entregas?error=invalid-request");
  await validateDeliveryCompany(id);
  const strokes = validateSignature(formData.get("signature"));
  if (!strokes) redirect(`/entregas/${id}/firma?error=invalid-signature`);
  let periodId: number;
  try { periodId = await saveDeliverySignature(id, strokes); }
  catch (error) { console.error("[cash-deliveries] Failed to save signature."); redirect(`/entregas/${id}/firma?error=${deliveryErrorCode(error) ?? "save-failed"}`); }
  revalidateDeliveryPaths(periodId);
  revalidatePath(`/entregas/${id}`);
  redirect(`/entregas/${id}?message=signed`);
}

function revalidateDeliveryPaths(periodId: number) { revalidatePath("/entregas"); revalidatePath(`/periodos/${periodId}`); }
function formValues(input: DeliveryInput) { return { companyId: String(input.companyId), accountingPeriodId: String(input.accountingPeriodId), deliveryDate: input.deliveryDate, storedAmount: input.storedAmount, amount: input.amount, deliveredBy: input.deliveredBy, receivedBy: input.receivedBy, notes: input.notes ?? "" }; }

async function validateDeliveryCompany(id: number): Promise<void> {
  const delivery = await getCashDelivery(id);
  if (!delivery) redirect("/entregas?error=invalid-request");
  await validateActiveCompany(delivery.companyId);
}
