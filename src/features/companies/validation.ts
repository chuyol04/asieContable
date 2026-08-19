import type {
  CompanyFormValues,
  CompanyInput,
  CompanyStatusFilter,
} from "./types";

type ValidationResult =
  | { success: true; data: CompanyInput }
  | { success: false; message: string; values: CompanyFormValues };

function text(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export function validateCompanyForm(formData: FormData): ValidationResult {
  const values = {
    name: text(formData, "name"),
    legalName: text(formData, "legalName"),
    taxId: text(formData, "taxId"),
    fiscalAddress: text(formData, "fiscalAddress"),
    phones: text(formData, "phones"),
    emails: text(formData, "emails"),
    website: text(formData, "website"),
    incorporationDate: text(formData, "incorporationDate"),
    notary: text(formData, "notary"),
    deedNumber: text(formData, "deedNumber"),
    observations: text(formData, "observations"),
  };

  if (!values.name) {
    return { success: false, message: "El nombre de la empresa es obligatorio.", values };
  }

  if (values.name.length > 191) {
    return { success: false, message: "El nombre no puede superar 191 caracteres.", values };
  }

  if (values.legalName.length > 255 || values.taxId.length > 32) {
    return { success: false, message: "La razón social o el identificador fiscal es demasiado largo.", values };
  }

  const phones = contactLines(values.phones);
  const emails = [...new Set(contactLines(values.emails).map((value) => value.toLowerCase()))];
  if (phones.some((value) => value.length > 32) || emails.some((value) => value.length > 191) || values.website.length > 255) return { success: false, message: "Un teléfono, correo o la página web es demasiado largo.", values };
  if (emails.some((value) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) return { success: false, message: "Uno de los correos electrónicos no es válido.", values };

  if (values.website) {
    try {
      const url = new URL(values.website);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    } catch {
      return { success: false, message: "La página web debe ser una URL http o https válida.", values };
    }
  }

  if (values.incorporationDate && !/^\d{4}-\d{2}-\d{2}$/.test(values.incorporationDate)) {
    return { success: false, message: "La fecha de constitución no es válida.", values };
  }

  if (values.notary.length > 191 || values.deedNumber.length > 100) {
    return { success: false, message: "La notaría o el número de escritura es demasiado largo.", values };
  }

  if (values.fiscalAddress.length > 5_000 || values.observations.length > 5_000) {
    return { success: false, message: "El domicilio u observaciones no puede superar 5000 caracteres.", values };
  }

  return {
    success: true,
    data: {
      name: values.name,
      legalName: values.legalName || null,
      taxId: values.taxId || null,
      fiscalAddress: values.fiscalAddress || null,
      phones,
      emails,
      website: values.website || null,
      incorporationDate: values.incorporationDate || null,
      notary: values.notary || null,
      deedNumber: values.deedNumber || null,
      observations: values.observations || null,
    },
  };
}

function contactLines(value: string): string[] {
  return [...new Set(value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))];
}

export function parseCompanyStatus(value?: string): CompanyStatusFilter {
  return value === "inactive" || value === "all" ? value : "active";
}

export function parseCompanyId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
