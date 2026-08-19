import type {
  PeriodFormValues,
  PeriodInput,
  PeriodStatus,
  PeriodStatusFilter,
} from "./types";

type ValidationResult =
  | { success: true; data: PeriodInput }
  | { success: false; message: string; values: PeriodFormValues };

export const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export const periodStatusLabels: Record<PeriodStatus, string> = {
  open: "Abierto",
  review: "En revisión",
  closed: "Cerrado",
};

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function parsePeriodId(value: unknown): number | null {
  const id = typeof value === "string" ? Number(value) : value;
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parsePeriodYear(value: unknown): number | null {
  const year = typeof value === "string" && value ? Number(value) : value;
  return typeof year === "number" && Number.isInteger(year) && year >= 1900 && year <= 2200 ? year : null;
}

export function parsePeriodStatus(value: unknown, fallback: PeriodStatusFilter = "all"): PeriodStatusFilter {
  return value === "open" || value === "review" || value === "closed" || value === "all" ? value : fallback;
}

export function validatePeriodForm(formData: FormData): ValidationResult {
  const values = {
    companyId: text(formData, "companyId"),
    month: text(formData, "month"),
    year: text(formData, "year"),
    notes: text(formData, "notes"),
  };
  const companyId = parsePeriodId(values.companyId);
  const month = Number(values.month);
  const year = parsePeriodYear(values.year);

  if (!companyId || !Number.isInteger(month) || month < 1 || month > 12 || !year) {
    return { success: false, message: "La empresa, el mes y el año son obligatorios.", values };
  }
  if (values.notes.length > 5_000) {
    return { success: false, message: "Las observaciones no pueden superar 5000 caracteres.", values };
  }
  return { success: true, data: { companyId, month, year, notes: values.notes || null } };
}

export function validatePeriodNotes(formData: FormData): { success: true; notes: string | null } | { success: false; message: string; values: PeriodFormValues } {
  const notes = text(formData, "notes");
  const values = { companyId: "", month: "", year: "", notes };
  return notes.length <= 5_000
    ? { success: true, notes: notes || null }
    : { success: false, message: "Las observaciones no pueden superar 5000 caracteres.", values };
}
