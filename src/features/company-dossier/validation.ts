import type {
  DocumentType,
  DossierFormValues,
  DossierInput,
  DossierSection,
  DossierTab,
} from "./types";

type ValidationResult =
  | { success: true; data: DossierInput }
  | { success: false; message: string; values: DossierFormValues };

export const documentTypes: Array<{ value: DocumentType; label: string }> = [
  { value: "acta_constitutiva", label: "Acta constitutiva" },
  { value: "constancia_fiscal", label: "Constancia de situación fiscal" },
  { value: "comprobante_domicilio", label: "Comprobante de domicilio" },
  { value: "identificacion_oficial", label: "INE / identificación oficial" },
  { value: "poder_notarial", label: "Poder notarial" },
  { value: "constancia_bancaria", label: "Constancia bancaria" },
  { value: "opinion_cumplimiento", label: "Opinión de cumplimiento" },
  { value: "poderes", label: "Poderes" },
  { value: "identificaciones", label: "Identificaciones" },
  { value: "comprobantes", label: "Comprobantes" },
  { value: "otros", label: "Otros" },
];

export function documentCategory(type: DocumentType): "Corporativos" | "Fiscales" | "Identificación" | "Domicilio" | "Bancarios" | "Otros" {
  if (type === "acta_constitutiva" || type === "poder_notarial" || type === "poderes") return "Corporativos";
  if (type === "constancia_fiscal" || type === "opinion_cumplimiento") return "Fiscales";
  if (type === "identificacion_oficial" || type === "identificaciones") return "Identificación";
  if (type === "comprobante_domicilio" || type === "comprobantes") return "Domicilio";
  if (type === "constancia_bancaria") return "Bancarios";
  return "Otros";
}

const sections: DossierSection[] = ["representantes", "documentos", "cuentas"];

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(value: string): boolean {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value;
}

function validUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseDossierSection(value: unknown): DossierSection | null {
  return typeof value === "string" && sections.includes(value as DossierSection)
    ? (value as DossierSection)
    : null;
}

export function parseDossierTab(value: unknown): DossierTab {
  return value === "general" || value === "periodos" || value === "productos" || value === "ordenes" || value === "caratulas" ? value : parseDossierSection(value) ?? "general";
}

export function parseRecordId(value: unknown): number | null {
  const id = typeof value === "string" ? Number(value) : value;
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function validateDossierForm(
  section: DossierSection,
  formData: FormData,
): ValidationResult {
  const observations = text(formData, "observations");
  if (section === "representantes") {
    const values = {
      fullName: text(formData, "fullName"),
      position: text(formData, "position"),
      taxId: text(formData, "taxId").toUpperCase(),
      curp: text(formData, "curp").toUpperCase(),
      email: text(formData, "email"),
      phone: text(formData, "phone"),
      observations,
    };
    if (observations.length > 5_000) {
      return { success: false, message: "Las observaciones no pueden superar 5000 caracteres.", values };
    }
    if (!values.fullName || !values.position) {
      return { success: false, message: "El nombre y el cargo son obligatorios.", values };
    }
    if (values.fullName.length > 191 || values.position.length > 191 || values.taxId.length > 32 || values.curp.length > 32 || values.email.length > 191 || values.phone.length > 32) {
      return { success: false, message: "Uno de los datos del representante es demasiado largo.", values };
    }
    if (!validEmail(values.email)) {
      return { success: false, message: "El correo electrónico no es válido.", values };
    }
    return { success: true, data: { kind: section, ...values, taxId: values.taxId || null, curp: values.curp || null, email: values.email || null, phone: values.phone || null, observations: observations || null } };
  }

  if (section === "documentos") {
    const values = {
      documentType: text(formData, "documentType"),
      documentName: text(formData, "documentName"),
      representativeId: text(formData, "representativeId"),
      documentDate: text(formData, "documentDate"),
      expirationDate: text(formData, "expirationDate"),
      externalUrl: text(formData, "externalUrl"),
      observations,
    };
    if (observations.length > 5_000) {
      return { success: false, message: "Las observaciones no pueden superar 5000 caracteres.", values };
    }
    const type = documentTypes.find(({ value }) => value === values.documentType)?.value;
    if (!type || !values.documentName || (values.documentDate && !validDate(values.documentDate))) {
      return { success: false, message: "El tipo y nombre son obligatorios; verifica la fecha de emisión.", values };
    }
    if (values.documentName.length > 191 || values.externalUrl.length > 2_048) {
      return { success: false, message: "El nombre o la referencia externa es demasiado larga.", values };
    }
    if (values.expirationDate && (!validDate(values.expirationDate) || (values.documentDate && values.expirationDate < values.documentDate))) {
      return { success: false, message: "La vigencia debe ser igual o posterior a la fecha del documento.", values };
    }
    if (!validUrl(values.externalUrl)) {
      return { success: false, message: "La referencia externa debe ser una URL http o https válida.", values };
    }
    const representativeId = values.representativeId ? parseRecordId(values.representativeId) : null;
    if (values.representativeId && !representativeId) return { success: false, message: "El representante seleccionado no es válido.", values };
    return { success: true, data: { kind: section, documentType: type, documentName: values.documentName, representativeId, documentDate: values.documentDate || null, expirationDate: values.expirationDate || null, externalUrl: values.externalUrl || null, observations: observations || null } };
  }

  const values = {
    bankId: text(formData, "bankId"),
    alias: text(formData, "alias"),
    accountNumber: text(formData, "accountNumber"),
    clabe: text(formData, "clabe"),
    branch: text(formData, "branch"),
    plaza: text(formData, "plaza"),
    currency: text(formData, "currency").toUpperCase(),
    holder: text(formData, "holder"),
    observations,
  };
  if (observations.length > 5_000) {
    return { success: false, message: "Las observaciones no pueden superar 5000 caracteres.", values };
  }
  const bankId = parseRecordId(values.bankId);
  if (!bankId || !values.alias || !values.accountNumber || !values.branch || !values.currency || !values.holder) {
    return { success: false, message: "Banco, alias, cuenta, sucursal, moneda y titular son obligatorios.", values };
  }
  if (!/^\d{18}$/.test(values.clabe)) {
    return { success: false, message: "La CLABE debe contener exactamente 18 dígitos.", values };
  }
  if (!/^[A-Z]{3}$/.test(values.currency)) {
    return { success: false, message: "La moneda debe expresarse con tres letras, por ejemplo MXN.", values };
  }
  if (values.alias.length > 191 || values.accountNumber.length > 64 || values.branch.length > 100 || values.plaza.length > 100 || values.holder.length > 191) {
    return { success: false, message: "Uno de los datos de la cuenta es demasiado largo.", values };
  }
  return { success: true, data: { kind: section, bankId, alias: values.alias, accountNumber: values.accountNumber, clabe: values.clabe, branch: values.branch, plaza: values.plaza || null, currency: values.currency, holder: values.holder, observations: observations || null } };
}

export function validateDocumentFile(value: FormDataEntryValue | null): { file: File | null; message?: string } {
  if (!(value instanceof File) || value.size === 0) return { file: null };
  const extension = value.name.toLowerCase().split(".").pop() ?? "";
  if (extension === "key") return { file: null, message: "No se permite almacenar llaves privadas .key." };
  const maxSizeMb = extension === "pdf" ? 20 : 15;
  if (value.size > maxSizeMb * 1024 * 1024) return { file: null, message: `El archivo no puede superar ${maxSizeMb} MB.` };
  const allowed = new Set(["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx", "xls", "xlsx"]);
  if (!allowed.has(extension)) return { file: null, message: "Formato no permitido. Usa PDF, imagen, Word o Excel." };
  return { file: value };
}

export function validateCoverTemplateFile(value: FormDataEntryValue | null): { file: File | null; message?: string } {
  if (!(value instanceof File) || value.size === 0) return { file: null, message: "Selecciona el PDF de la carátula." };
  if (!value.name.toLowerCase().endsWith(".pdf") || (value.type && value.type !== "application/pdf")) return { file: null, message: "La carátula debe ser un archivo PDF." };
  if (value.size > 20 * 1024 * 1024) return { file: null, message: "El PDF no puede superar 20 MB." };
  return { file: value };
}
