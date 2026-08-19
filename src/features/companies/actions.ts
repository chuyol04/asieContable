"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createCompany,
  isDuplicateCompanyName,
  setCompanyActive,
  updateCompany,
} from "./service";
import type { CompanyFormState } from "./types";
import { parseCompanyId, validateCompanyForm } from "./validation";

const duplicateMessage = "Ya existe una empresa con ese nombre.";
const saveErrorMessage = "No fue posible guardar la empresa. Inténtalo nuevamente.";

export async function createCompanyAction(
  _state: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const validation = validateCompanyForm(formData);

  if (!validation.success) {
    return { message: validation.message, values: validation.values };
  }

  let id: number;

  try {
    id = await createCompany(validation.data);
  } catch (error) {
    if (isDuplicateCompanyName(error)) {
      return { message: duplicateMessage };
    }

    console.error("[companies] Failed to create company.");
    return { message: saveErrorMessage };
  }

  revalidatePath("/empresas");
  redirect(`/empresas/${id}?message=created`);
}

export async function updateCompanyAction(
  id: number,
  _state: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  if (!Number.isSafeInteger(id) || id < 1) {
    return { message: "La empresa indicada no es válida." };
  }

  const validation = validateCompanyForm(formData);

  if (!validation.success) {
    return { message: validation.message, values: validation.values };
  }

  try {
    await updateCompany(id, validation.data);
  } catch (error) {
    if (isDuplicateCompanyName(error)) {
      return { message: duplicateMessage };
    }

    console.error("[companies] Failed to update company.");
    return { message: saveErrorMessage };
  }

  revalidatePath("/empresas");
  revalidatePath(`/empresas/${id}`);
  redirect(`/empresas/${id}?message=updated`);
}

export async function setCompanyStatusAction(formData: FormData): Promise<void> {
  const rawId = formData.get("id");
  const rawIsActive = formData.get("isActive");
  const id = typeof rawId === "string" ? parseCompanyId(rawId) : null;

  if (!id || (rawIsActive !== "true" && rawIsActive !== "false")) {
    redirect("/empresas?error=invalid-company");
  }

  const isActive = rawIsActive === "true";

  try {
    await setCompanyActive(id, isActive);
  } catch {
    console.error("[companies] Failed to change company status.");
    redirect("/empresas?error=status-update");
  }

  revalidatePath("/empresas");
  revalidatePath(`/empresas/${id}`);
  redirect("/empresas?message=status-updated");
}
