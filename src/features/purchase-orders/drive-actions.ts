"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPurchaseOrderDocumentData } from "@/features/purchase-orders/document-data";
import { deleteDriveFile, driveFileUrl, ensurePurchaseOrderFolder, GoogleDriveError, replacePurchaseOrderPdf, uploadPurchaseOrderPdf } from "@/features/purchase-orders/google-drive";
import { purchaseOrderPdfFilename, renderPurchaseOrderPdf } from "@/features/purchase-orders/pdf";
import { markPurchaseOrderSentToAccounting, savePurchaseOrderDriveDocument } from "@/features/purchase-orders/service";
import { parsePurchaseOrderId } from "@/features/purchase-orders/validation";
import { validateActiveCompany } from "@/features/company-context/service";

export async function savePurchaseOrderToDriveAction(formData: FormData): Promise<void> {
  const id = parsePurchaseOrderId(formData.get("id"));
  if (!id) redirect("/ordenes-compra?error=invalid-request");
  const replace = formData.get("mode") === "replace";
  const data = await getPurchaseOrderDocumentData(id);
  if (!data || data.order.status !== "confirmed") redirect(`/ordenes-compra/${id}?error=drive-not-allowed`);
  await validateActiveCompany(data.order.companyId);
  if (data.order.driveFileId && !replace) redirect(`/ordenes-compra/${id}?error=drive-already-stored`);
  if (!data.order.driveFileId && replace) redirect(`/ordenes-compra/${id}?error=drive-not-stored`);

  let createdFileId: string | null = null;
  try {
    const pdf = await renderPurchaseOrderPdf(data);
    const filename = purchaseOrderPdfFilename(data.company.name, data.order.orderNumber);
    const folder = data.order.driveFolderId
      ? { id: data.order.driveFolderId }
      : await ensurePurchaseOrderFolder(data.company.name, data.order.orderDate);
    const file = data.order.driveFileId
      ? await replacePurchaseOrderPdf(data.order.driveFileId, filename, pdf)
      : await uploadPurchaseOrderPdf(folder.id, filename, pdf);
    if (!data.order.driveFileId) createdFileId = file.id;
    const saved = await savePurchaseOrderDriveDocument(id, {
      fileId: file.id,
      fileName: file.name,
      folderId: folder.id,
      url: driveFileUrl(file),
    }, data.order.driveFileId);
    if (!saved) throw new GoogleDriveError("API", "La orden cambió mientras se guardaba el documento.");
  } catch (error) {
    if (createdFileId) await deleteDriveFile(createdFileId).catch(() => undefined);
    console.error("[purchase-orders] Google Drive upload failed.");
    const code = error instanceof GoogleDriveError && error.code === "CONFIG"
      ? "drive-not-configured"
      : error instanceof GoogleDriveError && error.code === "FILE_EXISTS" ? "drive-file-exists" : "drive-upload-failed";
    redirect(`/ordenes-compra/${id}?error=${code}`);
  }

  revalidatePath(`/ordenes-compra/${id}`);
  revalidatePath("/ordenes-compra");
  redirect(`/ordenes-compra/${id}?message=${replace ? "drive-replaced" : "drive-saved"}`);
}

export async function markPurchaseOrderSentToAccountingAction(formData: FormData): Promise<void> {
  const id = parsePurchaseOrderId(formData.get("id"));
  if (!id) redirect("/ordenes-compra?error=invalid-request");
  const data = await getPurchaseOrderDocumentData(id);
  if (!data) redirect("/ordenes-compra?error=invalid-request");
  await validateActiveCompany(data.order.companyId);
  let updated: boolean;
  try {
    updated = await markPurchaseOrderSentToAccounting(id);
  } catch {
    console.error("[purchase-orders] Failed to mark order as sent to accounting.");
    redirect(`/ordenes-compra/${id}?error=accounting-failed`);
  }
  if (!updated) redirect(`/ordenes-compra/${id}?error=accounting-not-allowed`);
  revalidatePath(`/ordenes-compra/${id}`);
  redirect(`/ordenes-compra/${id}?message=accounting-sent`);
}
