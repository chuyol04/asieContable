"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateActiveCompany } from "@/features/company-context/service";

import { createSupplier, isDuplicateSupplier, setSupplierActive, updateSupplier } from "./service";
import type { SupplierFormState } from "./types";
import { parseSupplierId, validateSupplierForm } from "./validation";

const duplicateMessage = "Ya existe un proveedor con esa razón social o RFC para esta empresa.";

export async function createSupplierAction(companyId: number, _state: SupplierFormState, formData: FormData): Promise<SupplierFormState> {
  if (!parseSupplierId(companyId)) return { message: "La empresa indicada no es válida." };
  await validateActiveCompany(companyId);
  const validation = validateSupplierForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };
  try { await createSupplier(companyId, validation.data); }
  catch (error) { if (isDuplicateSupplier(error)) return { message: duplicateMessage }; console.error("[suppliers] Failed to create supplier."); return { message: "No fue posible guardar el proveedor." }; }
  revalidatePath("/proveedores");
  redirect(`/proveedores?companyId=${companyId}&message=created`);
}

export async function updateSupplierAction(companyId: number, supplierId: number, _state: SupplierFormState, formData: FormData): Promise<SupplierFormState> {
  if (!parseSupplierId(companyId) || !parseSupplierId(supplierId)) return { message: "El proveedor indicado no es válido." };
  await validateActiveCompany(companyId);
  const validation = validateSupplierForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };
  try { if (!await updateSupplier(companyId, supplierId, validation.data)) return { message: "El proveedor no pertenece a esta empresa." }; }
  catch (error) { if (isDuplicateSupplier(error)) return { message: duplicateMessage }; console.error("[suppliers] Failed to update supplier."); return { message: "No fue posible actualizar el proveedor." }; }
  revalidatePath("/proveedores");
  redirect(`/proveedores?companyId=${companyId}&message=updated`);
}

export async function setSupplierStatusAction(formData: FormData): Promise<void> {
  const companyId = parseSupplierId(formData.get("companyId"));
  const supplierId = parseSupplierId(formData.get("supplierId"));
  const active = formData.get("isActive");
  if (!companyId || !supplierId || (active !== "true" && active !== "false")) redirect("/proveedores");
  await validateActiveCompany(companyId);
  await setSupplierActive(companyId, supplierId, active === "true");
  revalidatePath("/proveedores");
  redirect(`/proveedores?companyId=${companyId}`);
}
