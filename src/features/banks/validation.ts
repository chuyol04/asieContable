import type { BankFormValues, BankInput, BankStatusFilter } from "./types";

type ValidationResult =
  | { success: true; data: BankInput }
  | { success: false; message: string; values: BankFormValues };

function text(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export function validateBankForm(formData: FormData): ValidationResult {
  const values = {
    name: text(formData, "name"),
    shortName: text(formData, "shortName"),
  };

  if (!values.name) {
    return { success: false, message: "El nombre del banco es obligatorio.", values };
  }

  if (values.name.length > 191) {
    return { success: false, message: "El nombre no puede superar 191 caracteres.", values };
  }

  if (values.shortName.length > 64) {
    return { success: false, message: "El nombre corto no puede superar 64 caracteres.", values };
  }

  return {
    success: true,
    data: {
      name: values.name,
      shortName: values.shortName || null,
    },
  };
}

export function parseBankStatus(value?: string): BankStatusFilter {
  return value === "inactive" || value === "all" ? value : "active";
}

export function parseBankId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
