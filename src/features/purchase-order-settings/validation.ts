import { moneyToCents, normalizeMoney } from "@/features/expected-amounts/money";
import type { PurchaseOrderIdentityInput, PurchaseOrderSettingsFormValues, PurchaseOrderSettingsInput } from "./types";

type ValidationResult =
  | { success: true; identity: PurchaseOrderIdentityInput; settings: Omit<PurchaseOrderSettingsInput, "logoUrl"> }
  | { success: false; message: string; values: PurchaseOrderSettingsFormValues };

function text(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export function validatePurchaseOrderSettings(formData: FormData): ValidationResult {
  const values = {
    companyName: text(formData, "companyName"),
    legalName: text(formData, "legalName"),
    taxId: text(formData, "taxId"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    fiscalAddress: text(formData, "fiscalAddress"),
    orderPrefix: text(formData, "orderPrefix"),
    nextOrderNumber: text(formData, "nextOrderNumber"),
    defaultTaxRate: text(formData, "defaultTaxRate"),
    headerText: text(formData, "headerText"),
    footerText: text(formData, "footerText"),
    leftSignatureText: text(formData, "leftSignatureText"),
    rightSignatureText: text(formData, "rightSignatureText"),
    defaultNotes: text(formData, "defaultNotes"),
  };

  if (!values.companyName) return { success: false, message: "El nombre comercial es obligatorio.", values };
  if (values.companyName.length > 191 || values.legalName.length > 255 || values.taxId.length > 32 || values.phone.length > 32 || values.email.length > 191) {
    return { success: false, message: "Uno de los datos de la empresa es demasiado largo.", values };
  }
  if (values.fiscalAddress.length > 5_000 || values.headerText.length > 5_000 || values.footerText.length > 5_000 || values.defaultNotes.length > 5_000) {
    return { success: false, message: "Uno de los textos supera 5000 caracteres.", values };
  }
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) return { success: false, message: "El correo no es válido.", values };
  if (values.orderPrefix.length > 20 || values.leftSignatureText.length > 191 || values.rightSignatureText.length > 191) {
    return { success: false, message: "La serie o uno de los textos de firma es demasiado largo.", values };
  }

  const nextOrderNumber = /^\d+$/.test(values.nextOrderNumber) ? Number(values.nextOrderNumber) : 0;
  if (!Number.isSafeInteger(nextOrderNumber) || nextOrderNumber < 1) {
    return { success: false, message: "El siguiente número de orden debe ser un entero mayor a cero.", values };
  }
  const defaultTaxRate = normalizeMoney(values.defaultTaxRate);
  const taxCents = moneyToCents(defaultTaxRate);
  if (!defaultTaxRate || taxCents === null || taxCents < 0 || taxCents > 10_000) {
    return { success: false, message: "El IVA predeterminado debe estar entre 0 y 100.", values };
  }

  return {
    success: true,
    identity: {
      name: values.companyName,
      legalName: values.legalName || null,
      taxId: values.taxId || null,
      phone: values.phone || null,
      email: values.email || null,
      fiscalAddress: values.fiscalAddress || null,
    },
    settings: {
      orderPrefix: values.orderPrefix || null,
      nextOrderNumber,
      defaultTaxRate,
      headerText: values.headerText || null,
      footerText: values.footerText || null,
      leftSignatureText: values.leftSignatureText,
      rightSignatureText: values.rightSignatureText,
      defaultNotes: values.defaultNotes || null,
    },
  };
}

export function formatNextOrderNumber(prefix: string | null, number: number): string {
  return prefix ? `${prefix}-${number}` : String(number);
}
