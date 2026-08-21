"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/features/auth/authorization";
import { firebaseAdminAuth } from "@/features/auth/firebase-admin";
import { deleteDriveFile, driveFileUrl, ensurePayrollFolder, GoogleDriveError, replaceDriveFolderUser, shareDriveFolderWithUser, uploadDriveFile } from "@/features/purchase-orders/google-drive";

import { createClient, createPayrollFile, getClient, isDuplicateClient, rollbackNewClient, saveClientDriveFolder, setClientActive, setPayrollFileActive, updateClient } from "./service";
import type { ClientFormState, PayrollFormState } from "./types";
import { parseClientId, validateClientForm, validatePayrollUpload } from "./validation";

async function firebaseAccount(email: string) {
  try { return await firebaseAdminAuth.getUserByEmail(email); }
  catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "auth/user-not-found") return null;
    throw error;
  }
}

async function assignClientClaim(uid: string, clientId: number): Promise<void> {
  const user = await firebaseAdminAuth.getUser(uid);
  await firebaseAdminAuth.setCustomUserClaims(uid, { ...(user.customClaims ?? {}), role: "client", clientId });
  await firebaseAdminAuth.revokeRefreshTokens(uid);
}

export async function createClientAction(_state: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const admin = await requireAdminUser();
  const validation = validateClientForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };
  let clientId: number | null = null;
  try {
    const firebaseUser = await firebaseAccount(validation.data.userEmail);
    if (!firebaseUser) return { message: "El correo todavía no existe en Firebase Authentication." };
    if (firebaseUser.uid === admin.uid) return { message: "No puedes asociar el usuario administrador como cliente." };
    clientId = await createClient({ ...validation.data, firebaseUid: firebaseUser.uid });
    await assignClientClaim(firebaseUser.uid, clientId);
  } catch (error) {
    if (clientId) await rollbackNewClient(clientId).catch(() => undefined);
    if (isDuplicateClient(error)) return { message: "El correo o usuario Firebase ya está asociado con otro cliente." };
    console.error("[clients] Failed to create client.");
    return { message: "No fue posible guardar el cliente." };
  }
  revalidatePath("/clientes");
  redirect(`/clientes/${clientId}?message=created`);
}

export async function updateClientAction(clientId: number, _state: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const admin = await requireAdminUser();
  if (!parseClientId(clientId)) return { message: "El cliente indicado no es válido." };
  const validation = validateClientForm(formData);
  if (!validation.success) return { message: validation.message, values: validation.values };
  let permissionChanged: { folderId: string; previousEmail: string; nextEmail: string } | null = null;
  let databaseUpdated = false;
  try {
    const current = await getClient(clientId);
    if (!current) return { message: "El cliente no existe." };
    const firebaseUser = await firebaseAccount(validation.data.userEmail);
    if (!firebaseUser) return { message: "El correo todavía no existe en Firebase Authentication." };
    if (firebaseUser.uid === admin.uid) return { message: "No puedes asociar el usuario administrador como cliente." };
    if (current.driveFolderId && current.userEmail !== validation.data.userEmail) {
      await replaceDriveFolderUser(current.driveFolderId, current.userEmail, validation.data.userEmail);
      permissionChanged = { folderId: current.driveFolderId, previousEmail: current.userEmail, nextEmail: validation.data.userEmail };
    }
    if (!await updateClient(clientId, { ...validation.data, firebaseUid: firebaseUser.uid })) return { message: "El cliente no existe." };
    databaseUpdated = true;
    await assignClientClaim(firebaseUser.uid, clientId);
  } catch (error) {
    if (permissionChanged && !databaseUpdated) await replaceDriveFolderUser(permissionChanged.folderId, permissionChanged.nextEmail, permissionChanged.previousEmail).catch(() => undefined);
    if (isDuplicateClient(error)) return { message: "El correo o usuario Firebase ya está asociado con otro cliente." };
    console.error("[clients] Failed to update client.");
    return { message: "No fue posible actualizar el cliente." };
  }
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  redirect(`/clientes/${clientId}?message=updated`);
}

export async function setClientStatusAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const clientId = parseClientId(formData.get("clientId"));
  const active = formData.get("isActive");
  if (!clientId || (active !== "true" && active !== "false")) redirect("/clientes");
  await setClientActive(clientId, active === "true");
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  redirect(`/clientes/${clientId}?message=status-updated`);
}

export async function uploadPayrollAction(clientId: number, _state: PayrollFormState, formData: FormData): Promise<PayrollFormState> {
  await requireAdminUser();
  if (!parseClientId(clientId)) return { message: "El cliente indicado no es válido." };
  const validation = validatePayrollUpload(formData);
  if (!validation.success) return { message: validation.message };
  const client = await getClient(clientId);
  if (!client || !client.isActive) return { message: "El cliente no existe o está inactivo." };
  let createdFileId: string | null = null;
  let sharingPending = false;
  try {
    const folder = await ensurePayrollFolder(client.name, validation.data.year, validation.data.month);
    if (client.driveFolderId !== folder.clientFolderId) await saveClientDriveFolder(clientId, folder.clientFolderId);
    const filename = validation.data.file.name.replace(/[\\/]/g, "-").slice(0, 255);
    const bytes = new Uint8Array(await validation.data.file.arrayBuffer());
    const uploaded = await uploadDriveFile(folder.id, filename, validation.data.file.type || payrollMimeType(validation.data.fileType), bytes);
    createdFileId = uploaded.id;
    await createPayrollFile({ clientId, fileName: uploaded.name, fileType: validation.data.fileType, driveFileId: uploaded.id, driveUrl: driveFileUrl(uploaded), payrollDate: validation.data.payrollDate, periodMonth: validation.data.month, periodYear: validation.data.year, notes: validation.data.notes });
    try {
      await shareDriveFolderWithUser(folder.clientFolderId, client.userEmail);
    } catch (error) {
      sharingPending = true;
      console.warn(`[clients] Payroll uploaded, but Drive sharing failed: ${error instanceof GoogleDriveError ? error.message : "unknown error"}`);
    }
  } catch (error) {
    if (createdFileId) await deleteDriveFile(createdFileId).catch(() => undefined);
    if (error instanceof GoogleDriveError) {
      console.error(`[clients] Payroll Drive operation failed: ${error.message}`);
      return { message: error.code === "CONFIG" ? "Configura Google Drive antes de cargar nóminas." : error.code === "FILE_EXISTS" ? "Ya existe un archivo con ese nombre en el periodo." : "No fue posible cargar el archivo en Google Drive." };
    }
    console.error("[clients] Failed to upload payroll file.");
    return { message: "No fue posible guardar la nómina." };
  }
  revalidatePath(`/clientes/${clientId}`);
  redirect(`/clientes/${clientId}?message=${sharingPending ? "payroll-uploaded-sharing-pending" : "payroll-uploaded"}`);
}

export async function setPayrollStatusAction(formData: FormData): Promise<void> {
  await requireAdminUser();
  const clientId = parseClientId(formData.get("clientId"));
  const payrollFileId = parseClientId(formData.get("payrollFileId"));
  const active = formData.get("isActive");
  if (!clientId || !payrollFileId || (active !== "true" && active !== "false")) redirect("/clientes");
  await setPayrollFileActive(clientId, payrollFileId, active === "true");
  revalidatePath(`/clientes/${clientId}`);
  redirect(`/clientes/${clientId}?message=payroll-status-updated`);
}

function payrollMimeType(type: "pdf" | "xls" | "xlsx"): string {
  return type === "pdf" ? "application/pdf" : type === "xls" ? "application/vnd.ms-excel" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}
