"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseCompanyId } from "@/features/companies/validation";
import { validateActiveCompany } from "@/features/company-context/service";
import { deleteLogoFile, LogoUploadError, writeLogoFile } from "./logo-storage";
import { getPurchaseOrderSettings, isDuplicateCompanyName, savePurchaseOrderSettings } from "./service";
import type { PurchaseOrderSettingsFormState } from "./types";
import { validatePurchaseOrderSettings } from "./validation";

export async function savePurchaseOrderSettingsAction(companyId: number, _state: PurchaseOrderSettingsFormState, formData: FormData): Promise<PurchaseOrderSettingsFormState> {
  if (!parseCompanyId(String(companyId))) return { message: "La empresa indicada no es válida." };
  await validateActiveCompany(companyId);
  const validation = validatePurchaseOrderSettings(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };

  const current = await getPurchaseOrderSettings(companyId);
  let uploadedLogo: string | null = null;
  try {
    uploadedLogo = await writeLogoFile(companyId, formData.get("logo"));
    const removeLogo = formData.get("removeLogo") === "true";
    const logoUrl = uploadedLogo ?? (removeLogo ? null : current?.logoUrl ?? null);
    await savePurchaseOrderSettings(companyId, validation.identity, { ...validation.settings, logoUrl });
    if (current?.logoUrl && current.logoUrl !== logoUrl) await deleteLogoFile(current.logoUrl);
  } catch (error) {
    await deleteLogoFile(uploadedLogo);
    if (error instanceof LogoUploadError) return { message: error.message };
    if (isDuplicateCompanyName(error)) return { message: "Ya existe otra empresa con ese nombre." };
    console.error("[purchase-order-settings] Failed to save settings.");
    return { message: "No fue posible guardar la configuración. Inténtalo nuevamente." };
  }

  revalidatePath(`/empresas/${companyId}`);
  revalidatePath(`/empresas/${companyId}/configuracion-ordenes`);
  redirect(`/empresas/${companyId}/configuracion-ordenes?message=saved`);
}
