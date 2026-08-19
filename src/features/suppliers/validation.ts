import type { SupplierFormValues, SupplierInput, SupplierStatusFilter } from "./types";

type ValidationResult = { success: true; data: SupplierInput } | { success: false; message: string; values: SupplierFormValues };

function text(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export function validateSupplierForm(formData: FormData): ValidationResult {
  const values = { legalName: text(formData, "legalName"), taxId: text(formData, "taxId").toUpperCase(), fiscalAddress: text(formData, "fiscalAddress"), phone: text(formData, "phone") };
  if (!values.legalName) return { success: false, message: "La razón social es obligatoria.", values };
  if (values.legalName.length > 255 || values.taxId.length > 32 || values.phone.length > 32) return { success: false, message: "La razón social, RFC o teléfono son demasiado largos.", values };
  if (values.fiscalAddress.length > 5_000) return { success: false, message: "El domicilio fiscal es demasiado largo.", values };
  return { success: true, data: { legalName: values.legalName, taxId: values.taxId || null, fiscalAddress: values.fiscalAddress || null, phone: values.phone || null } };
}

export function parseSupplierId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parseSupplierStatus(value: unknown): SupplierStatusFilter {
  return value === "inactive" || value === "all" ? value : "active";
}
