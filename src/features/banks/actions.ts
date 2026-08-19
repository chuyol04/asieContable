"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createBank,
  isDuplicateBankName,
  setBankActive,
  updateBank,
} from "./service";
import type { BankFormState } from "./types";
import { parseBankId, validateBankForm } from "./validation";

const duplicateMessage = "Ya existe un banco con ese nombre.";
const saveErrorMessage = "No fue posible guardar el banco. Inténtalo nuevamente.";

export async function createBankAction(
  _state: BankFormState,
  formData: FormData,
): Promise<BankFormState> {
  const validation = validateBankForm(formData);

  if (!validation.success) {
    return { message: validation.message, values: validation.values };
  }

  let id: number;

  try {
    id = await createBank(validation.data);
  } catch (error) {
    if (isDuplicateBankName(error)) return { message: duplicateMessage };
    console.error("[banks] Failed to create bank.");
    return { message: saveErrorMessage };
  }

  revalidatePath("/bancos");
  redirect(`/bancos/${id}?message=created`);
}

export async function updateBankAction(
  id: number,
  _state: BankFormState,
  formData: FormData,
): Promise<BankFormState> {
  if (!Number.isSafeInteger(id) || id < 1) {
    return { message: "El banco indicado no es válido." };
  }

  const validation = validateBankForm(formData);

  if (!validation.success) {
    return { message: validation.message, values: validation.values };
  }

  try {
    await updateBank(id, validation.data);
  } catch (error) {
    if (isDuplicateBankName(error)) return { message: duplicateMessage };
    console.error("[banks] Failed to update bank.");
    return { message: saveErrorMessage };
  }

  revalidatePath("/bancos");
  revalidatePath(`/bancos/${id}`);
  redirect(`/bancos/${id}?message=updated`);
}

export async function setBankStatusAction(formData: FormData): Promise<void> {
  const rawId = formData.get("id");
  const rawIsActive = formData.get("isActive");
  const id = typeof rawId === "string" ? parseBankId(rawId) : null;

  if (!id || (rawIsActive !== "true" && rawIsActive !== "false")) {
    redirect("/bancos?error=invalid-bank");
  }

  try {
    await setBankActive(id, rawIsActive === "true");
  } catch {
    console.error("[banks] Failed to change bank status.");
    redirect("/bancos?error=status-update");
  }

  revalidatePath("/bancos");
  revalidatePath(`/bancos/${id}`);
  redirect("/bancos?message=status-updated");
}
