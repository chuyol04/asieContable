import type { ClientFormValues, ClientInput, ClientStatusFilter } from "./types";

type ClientValidation = { success: true; data: Omit<ClientInput, "firebaseUid"> } | { success: false; message: string; values: ClientFormValues };
export type PayrollUpload = { files: Array<{ file: File; fileType: "pdf" | "xls" | "xlsx" }>; month: number; year: number; payrollDate: string | null; notes: string | null };
type PayrollValidation = { success: true; data: PayrollUpload } | { success: false; message: string };

export const MAX_PAYROLL_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_PAYROLL_BATCH_BYTES = 100 * 1024 * 1024;
export const MAX_PAYROLL_FILES = 10;

function text(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function validateClientForm(formData: FormData): ClientValidation {
  const values: ClientFormValues = {
    name: text(formData, "name"),
    legalName: text(formData, "legalName"),
    taxId: text(formData, "taxId").toUpperCase(),
    userEmail: text(formData, "userEmail").toLowerCase(),
    phone: text(formData, "phone"),
    website: text(formData, "website"),
    notes: text(formData, "notes"),
  };
  if (!values.name) return { success: false, message: "El nombre del cliente es obligatorio.", values };
  if (!/^\S+@\S+\.\S+$/.test(values.userEmail)) return { success: false, message: "Ingresa un correo válido registrado en Firebase.", values };
  if (values.name.length > 191 || values.legalName.length > 255 || values.taxId.length > 32 || values.userEmail.length > 191 || values.phone.length > 32) {
    return { success: false, message: "Uno de los datos capturados excede la longitud permitida.", values };
  }
  if (values.website.length > 500 || values.notes.length > 5_000) return { success: false, message: "La página web o las observaciones son demasiado largas.", values };
  if (values.website) {
    try {
      const url = new URL(values.website);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
    } catch {
      return { success: false, message: "La página web debe ser una URL válida con http o https.", values };
    }
  }
  return { success: true, data: {
    name: values.name,
    legalName: values.legalName || null,
    taxId: values.taxId || null,
    userEmail: values.userEmail,
    phone: values.phone || null,
    website: values.website || null,
    notes: values.notes || null,
  } };
}

export function validatePayrollUpload(formData: FormData): PayrollValidation {
  const values = formData.getAll("payrollFiles");
  const month = Number(text(formData, "periodMonth"));
  const year = Number(text(formData, "periodYear"));
  const payrollDateValue = text(formData, "payrollDate");
  const notes = text(formData, "notes");
  if (!values.length || values.some((value) => !(value instanceof File) || value.size === 0)) return { success: false, message: "Selecciona uno o varios archivos PDF, XLS o XLSX." };
  if (values.length > MAX_PAYROLL_FILES) return { success: false, message: `Puedes cargar máximo ${MAX_PAYROLL_FILES} archivos a la vez.` };
  const files = values.map((value) => {
    const file = value as File;
    const fileType = /\.([^.]+)$/.exec(file.name.toLowerCase())?.[1];
    return { file, fileType };
  });
  if (files.some(({ fileType }) => fileType !== "pdf" && fileType !== "xls" && fileType !== "xlsx")) return { success: false, message: "Solo se permiten archivos PDF, XLS y XLSX." };
  if (files.some(({ file }) => file.size > MAX_PAYROLL_FILE_BYTES)) return { success: false, message: "Cada archivo puede pesar máximo 20 MB." };
  if (files.reduce((total, { file }) => total + file.size, 0) > MAX_PAYROLL_BATCH_BYTES) return { success: false, message: "La carga completa no puede exceder 100 MB." };
  if (!Number.isInteger(month) || month < 1 || month > 12) return { success: false, message: "Selecciona un mes válido." };
  if (!Number.isInteger(year) || year < 2000 || year > 2200) return { success: false, message: "Ingresa un año válido." };
  if (payrollDateValue && !validDate(payrollDateValue)) return { success: false, message: "La fecha de nómina no es válida." };
  if (notes.length > 5_000) return { success: false, message: "Las observaciones son demasiado largas." };
  return { success: true, data: { files: files as PayrollUpload["files"], month, year, payrollDate: payrollDateValue || null, notes: notes || null } };
}

export function parseClientId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parseClientStatus(value: unknown): ClientStatusFilter {
  return value === "inactive" || value === "all" ? value : "active";
}

export function parsePeriodFilter(yearValue: unknown, monthValue: unknown, nameValue?: unknown, dateValue?: unknown): { year: number | null; month: number | null; name: string; date: string | null } {
  const year = Number(yearValue);
  const month = Number(monthValue);
  const name = typeof nameValue === "string" ? nameValue.trim().slice(0, 255) : "";
  const date = typeof dateValue === "string" && validDate(dateValue) ? dateValue : null;
  return {
    year: Number.isInteger(year) && year >= 2000 && year <= 2200 ? year : null,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : null,
    name,
    date,
  };
}
