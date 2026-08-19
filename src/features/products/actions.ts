"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateActiveCompany } from "@/features/company-context/service";

import { createProduct, isDuplicateProductReference, setProductActive, updateProduct } from "./service";
import type { ProductFormState } from "./types";
import { parseProductId, validateProductForm } from "./validation";

const duplicateMessage = "Ya existe un producto con esa referencia en esta empresa.";
const saveErrorMessage = "No fue posible guardar el producto. Inténtalo nuevamente.";

export async function createProductAction(companyId: number, _state: ProductFormState, formData: FormData): Promise<ProductFormState> {
  if (!parseProductId(companyId)) return { message: "La empresa indicada no es válida." };
  await validateActiveCompany(companyId);
  const validation = validateProductForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };

  let id: number;
  try {
    id = await createProduct(companyId, validation.data);
  } catch (error) {
    if (isDuplicateProductReference(error)) return { message: duplicateMessage };
    console.error("[products] Failed to create product.");
    return { message: saveErrorMessage };
  }
  revalidatePath(`/empresas/${companyId}`);
  redirect(`/empresas/${companyId}/productos/${id}?message=created`);
}

export async function updateProductAction(companyId: number, productId: number, _state: ProductFormState, formData: FormData): Promise<ProductFormState> {
  if (!parseProductId(companyId) || !parseProductId(productId)) return { message: "El producto indicado no es válido." };
  await validateActiveCompany(companyId);
  const validation = validateProductForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };

  try {
    if (!await updateProduct(companyId, productId, validation.data)) return { message: "El producto no existe en esta empresa." };
  } catch (error) {
    if (isDuplicateProductReference(error)) return { message: duplicateMessage };
    console.error("[products] Failed to update product.");
    return { message: saveErrorMessage };
  }
  revalidatePath(`/empresas/${companyId}`);
  revalidatePath(`/empresas/${companyId}/productos/${productId}`);
  redirect(`/empresas/${companyId}/productos/${productId}?message=updated`);
}

export async function setProductStatusAction(formData: FormData): Promise<void> {
  const companyId = parseProductId(formData.get("companyId"));
  const productId = parseProductId(formData.get("productId"));
  const active = formData.get("isActive");
  if (!companyId || !productId || (active !== "true" && active !== "false")) redirect("/empresas");
  await validateActiveCompany(companyId);

  let updated: boolean;
  try {
    updated = await setProductActive(companyId, productId, active === "true");
  } catch {
    console.error("[products] Failed to change product status.");
    redirect(`/empresas/${companyId}?tab=productos&error=status-update`);
  }
  if (!updated) redirect(`/empresas/${companyId}?tab=productos`);
  revalidatePath(`/empresas/${companyId}`);
  revalidatePath(`/empresas/${companyId}/productos/${productId}`);
  redirect(`/empresas/${companyId}?tab=productos&message=status-updated`);
}
