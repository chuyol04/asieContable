"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompany } from "@/features/companies/service";
import { validateActiveCompany } from "@/features/company-context/service";
import { deleteDriveFile, driveFileUrl, ensureCompanyDocumentFolder, GoogleDriveError, replaceDriveFile, uploadDriveFile } from "@/features/purchase-orders/google-drive";

import { getCompanyCoverTemplate, getCompanyDocument, getDossierRecord, isDuplicateAccount, saveCompanyCoverTemplate, saveDossierRecord, setDossierRecordActive } from "./service";
import type { DocumentFileMetadata, DossierFormState, DossierSection } from "./types";
import { documentCategory, parseDossierSection, parseRecordId, validateCoverTemplateFile, validateDocumentFile, validateDossierForm } from "./validation";

export async function saveDossierAction(
  companyId: number,
  section: DossierSection,
  recordId: number | null,
  _state: DossierFormState,
  formData: FormData,
): Promise<DossierFormState> {
  if (!parseRecordId(companyId) || !parseDossierSection(section) || (recordId !== null && !parseRecordId(recordId))) {
    return { message: "El registro indicado no es válido." };
  }
  try { await validateActiveCompany(companyId); } catch { return { message: "La empresa no coincide con el contexto activo." }; }
  const validation = validateDossierForm(section, formData);
  if (!validation.success) return { message: validation.message, values: validation.values };

  if (validation.data.kind === "documentos" && validation.data.representativeId && !await getDossierRecord(companyId, "representantes", validation.data.representativeId)) return { message: "El representante seleccionado no pertenece a esta empresa." };
  const fileValidation = section === "documentos" ? validateDocumentFile(formData.get("documentFile")) : { file: null };
  if (fileValidation.message) return { message: fileValidation.message };
  let documentFile: DocumentFileMetadata | undefined;
  let createdFileId: string | null = null;

  try {
    if (validation.data.kind === "documentos" && fileValidation.file) {
      const [company, current] = await Promise.all([getCompany(companyId), recordId ? getCompanyDocument(companyId, recordId) : Promise.resolve(null)]);
      if (!company || (recordId && !current)) return { message: "El documento indicado no pertenece a esta empresa." };
      const data = new Uint8Array(await fileValidation.file.arrayBuffer());
      const filename = fileValidation.file.name.replace(/[\\/]/g, "-").slice(0, 255);
      const uploaded = current?.fileId
        ? await replaceDriveFile(current.fileId, filename, fileValidation.file.type || "application/octet-stream", data)
        : await ensureCompanyDocumentFolder(company.name, documentCategory(validation.data.documentType)).then((folder) => uploadDriveFile(folder.id, filename, fileValidation.file!.type || "application/octet-stream", data));
      if (!current?.fileId) createdFileId = uploaded.id;
      documentFile = { fileId: uploaded.id, fileName: uploaded.name, fileUrl: driveFileUrl(uploaded), storageProvider: "google_drive", uploadedAt: new Date() };
    }
    await saveDossierRecord(companyId, recordId, validation.data, documentFile);
  } catch (error) {
    if (createdFileId) await deleteDriveFile(createdFileId).catch(() => undefined);
    if (section === "cuentas" && isDuplicateAccount(error)) {
      return { message: "La cuenta o CLABE ya está registrada." };
    }
    if (error instanceof GoogleDriveError) return { message: error.code === "CONFIG" ? "Configura Google Drive antes de cargar archivos." : error.code === "FILE_EXISTS" ? "Ya existe un archivo con ese nombre en la carpeta de Drive." : "No fue posible cargar el archivo en Google Drive." };
    console.error("[company-dossier] Failed to save record.");
    return { message: "No fue posible guardar el registro. Inténtalo nuevamente." };
  }

  revalidatePath(`/empresas/${companyId}`);
  redirect(`/empresas/${companyId}?tab=${section}&message=${recordId ? "record-updated" : "record-created"}`);
}

export async function setDossierStatusAction(formData: FormData): Promise<void> {
  const companyId = parseRecordId(formData.get("companyId"));
  const recordId = parseRecordId(formData.get("recordId"));
  const section = parseDossierSection(formData.get("section"));
  const activeValue = formData.get("isActive");

  if (!companyId || !recordId || !section || (activeValue !== "true" && activeValue !== "false")) {
    redirect("/empresas?error=invalid-record");
  }
  try { await validateActiveCompany(companyId); } catch { redirect("/empresas?error=invalid-record"); }

  try {
    await setDossierRecordActive(companyId, section, recordId, activeValue === "true");
  } catch {
    console.error("[company-dossier] Failed to change record status.");
    redirect(`/empresas/${companyId}?tab=${section}&error=status-update`);
  }

  revalidatePath(`/empresas/${companyId}`);
  redirect(`/empresas/${companyId}?tab=${section}&message=status-updated`);
}

export async function saveCompanyCoverTemplateAction(formData: FormData): Promise<void> {
  const companyId = parseRecordId(formData.get("companyId"));
  if (!companyId) redirect("/empresas?error=invalid-record");
  try { await validateActiveCompany(companyId); } catch { redirect("/empresas?error=invalid-record"); }

  const validation = validateCoverTemplateFile(formData.get("coverFile"));
  if (!validation.file) redirect(`/empresas/${companyId}?tab=caratulas&error=cover-invalid`);

  let createdFileId: string | null = null;
  try {
    const [company, current] = await Promise.all([getCompany(companyId), getCompanyCoverTemplate(companyId)]);
    if (!company) redirect("/empresas?error=invalid-record");
    const filename = validation.file.name.replace(/[\\/]/g, "-").slice(0, 255);
    const data = new Uint8Array(await validation.file.arrayBuffer());
    const uploaded = current
      ? await replaceDriveFile(current.fileId, filename, "application/pdf", data)
      : await ensureCompanyDocumentFolder(company.name, "Carátulas").then((folder) => uploadDriveFile(folder.id, filename, "application/pdf", data));
    if (!current) createdFileId = uploaded.id;
    await saveCompanyCoverTemplate(companyId, {
      fileId: uploaded.id,
      fileName: uploaded.name,
      fileUrl: driveFileUrl(uploaded),
      storageProvider: "google_drive",
      uploadedAt: new Date(),
    });
  } catch (error) {
    if (createdFileId) await deleteDriveFile(createdFileId).catch(() => undefined);
    if (error instanceof GoogleDriveError) {
      const code = error.code === "CONFIG" ? "cover-drive-config" : error.code === "FILE_EXISTS" ? "cover-file-exists" : "cover-drive-upload";
      redirect(`/empresas/${companyId}?tab=caratulas&error=${code}`);
    }
    console.error("[company-dossier] Failed to save cover template.");
    redirect(`/empresas/${companyId}?tab=caratulas&error=cover-save`);
  }

  revalidatePath(`/empresas/${companyId}`);
  redirect(`/empresas/${companyId}?tab=caratulas&message=cover-saved`);
}
