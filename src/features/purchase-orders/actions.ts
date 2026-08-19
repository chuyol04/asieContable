"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseCompanyId } from "@/features/companies/validation";
import { validateActiveCompany } from "@/features/company-context/service";
import { deleteDriveFile, GoogleDriveError } from "./google-drive";
import { createPurchaseOrder, getPurchaseOrder, purchaseOrderErrorCode, setPurchaseOrderStatus, updatePurchaseOrder } from "./service";
import type { PurchaseOrderFormState } from "./types";
import { canTransitionPurchaseOrderStatus, parsePurchaseOrderId, validatePurchaseOrderForm } from "./validation";

const errors: Record<string, string> = {
  SETTINGS_REQUIRED: "Configura primero la numeración de órdenes de esta empresa.",
  INVALID_SEQUENCE: "El siguiente número configurado no es válido.",
  DUPLICATE_NUMBER: "El siguiente folio ya fue utilizado. Ajusta la numeración de la empresa.",
  INVALID_PRODUCT: "Una partida utiliza un producto inactivo o de otra empresa.",
  INVALID_ITEM: "Una partida existente no pertenece a esta orden.",
  DISCOUNT_EXCEEDS_SUBTOTAL: "El descuento de una partida supera su subtotal.",
  AMOUNT_TOO_LARGE: "Uno de los totales supera el importe permitido.",
  INVALID_AMOUNT: "Una partida contiene una cantidad, precio, descuento o IVA inválido.",
  ORDER_LOCKED: "Sólo se pueden editar órdenes en borrador.",
  ORDER_NOT_FOUND: "La orden indicada no existe.",
  SAVE_FAILED: "No fue posible guardar la orden. Inténtalo nuevamente.",
};

export async function createPurchaseOrderAction(companyId: number, _state: PurchaseOrderFormState, formData: FormData): Promise<PurchaseOrderFormState> {
  if (!parseCompanyId(String(companyId))) return { message: "La empresa indicada no es válida." };
  await validateActiveCompany(companyId);
  const validation = validatePurchaseOrderForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };
  let id: number;
  try { id = await createPurchaseOrder(companyId, validation.data); }
  catch (error) { const code = purchaseOrderErrorCode(error); if (code === "SAVE_FAILED") console.error("[purchase-orders] Failed to create order."); return { message: errors[code] ?? errors.SAVE_FAILED }; }
  revalidateOrderPaths(id);
  redirect(`/ordenes-compra/${id}?message=created`);
}

export async function updatePurchaseOrderAction(id: number, _state: PurchaseOrderFormState, formData: FormData): Promise<PurchaseOrderFormState> {
  if (!parsePurchaseOrderId(id)) return { message: "La orden indicada no es válida." };
  const current = await getPurchaseOrder(id);
  if (!current) return { message: errors.ORDER_NOT_FOUND };
  await validateActiveCompany(current.companyId);
  const validation = validatePurchaseOrderForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };
  try { await updatePurchaseOrder(id, validation.data); }
  catch (error) { const code = purchaseOrderErrorCode(error); if (code === "SAVE_FAILED") console.error("[purchase-orders] Failed to update order."); return { message: errors[code] ?? errors.SAVE_FAILED }; }
  revalidateOrderPaths(id);
  redirect(`/ordenes-compra/${id}?message=updated`);
}

export async function setPurchaseOrderStatusAction(formData: FormData): Promise<void> {
  const id = parsePurchaseOrderId(formData.get("id"));
  const target = formData.get("status");
  if (!id || (target !== "confirmed" && target !== "cancelled")) redirect("/ordenes-compra?error=invalid-request");
  const current = await getPurchaseOrder(id);
  if (!current) redirect("/ordenes-compra?error=invalid-request");
  await validateActiveCompany(current.companyId);
  if (!canTransitionPurchaseOrderStatus(current.status, target)) redirect(`/ordenes-compra/${id}?error=status-not-allowed`);
  if (target === "cancelled" && current.driveFileId) {
    try {
      await deleteDriveFile(current.driveFileId);
    } catch (error) {
      console.error("[purchase-orders] Failed to delete cancelled order document from Drive.");
      redirect(`/ordenes-compra/${id}?error=${error instanceof GoogleDriveError && error.code === "CONFIG" ? "drive-delete-not-configured" : "drive-delete-failed"}`);
    }
  }
  let updated: boolean;
  try {
    updated = await setPurchaseOrderStatus(id, target);
  } catch {
    console.error("[purchase-orders] Failed to change status.");
    redirect(`/ordenes-compra/${id}?error=status-failed`);
  }
  if (!updated) redirect(`/ordenes-compra/${id}?error=status-not-allowed`);
  revalidateOrderPaths(id);
  redirect(`/ordenes-compra/${id}?message=${target}`);
}

function revalidateOrderPaths(id: number): void {
  revalidatePath("/ordenes-compra");
  revalidatePath(`/ordenes-compra/${id}`);
}
