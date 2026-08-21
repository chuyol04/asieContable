import { moneyToCents, normalizeMoney } from "../expected-amounts/money.ts";
import type { ProductFormValues, ProductInput, ProductStatusFilter } from "./types";

type ValidationResult =
  | { success: true; data: ProductInput }
  | { success: false; message: string; values: ProductFormValues };

function text(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export function validateProductForm(formData: FormData): ValidationResult {
  const values = {
    sku: text(formData, "sku"),
    name: text(formData, "name"),
    description: text(formData, "description"),
    unit: text(formData, "unit"),
    unitPrice: text(formData, "unitPrice"),
    purchaseCost: text(formData, "purchaseCost"),
    defaultMarginPercentage: text(formData, "defaultMarginPercentage"),
    taxRate: text(formData, "taxRate"),
    notes: text(formData, "notes"),
  };

  if (!values.name || !values.unit) {
    return { success: false, message: "El nombre y la unidad son obligatorios.", values };
  }
  if (values.sku.length > 100 || values.name.length > 191 || values.unit.length > 64) {
    return { success: false, message: "La referencia, el nombre o la unidad son demasiado largos.", values };
  }
  if (values.description.length > 10_000 || values.notes.length > 5_000) {
    return { success: false, message: "La descripción o las observaciones son demasiado largas.", values };
  }

  const unitPrice = normalizeMoney(values.unitPrice);
  if (!unitPrice || moneyToCents(unitPrice)! < 0) {
    return { success: false, message: "El precio unitario debe ser un importe válido mayor o igual a cero.", values };
  }
  const taxRate = values.taxRate ? normalizeMoney(values.taxRate) : null;
  const taxCents = moneyToCents(taxRate);
  if (values.taxRate && (!taxRate || taxCents === null || taxCents < 0 || taxCents > 10_000)) {
    return { success: false, message: "El IVA debe ser un porcentaje entre 0 y 100.", values };
  }
  const purchaseCost = values.purchaseCost ? normalizeMoney(values.purchaseCost) : null;
  if (values.purchaseCost && (!purchaseCost || moneyToCents(purchaseCost)! < 0)) {
    return { success: false, message: "El costo de compra debe ser un importe válido mayor o igual a cero.", values };
  }
  const defaultMarginPercentage = values.defaultMarginPercentage ? normalizeMoney(values.defaultMarginPercentage) : null;
  const marginCents = moneyToCents(defaultMarginPercentage);
  if (values.defaultMarginPercentage && (!defaultMarginPercentage || marginCents === null || marginCents < 0 || marginCents > 10_000)) {
    return { success: false, message: "El margen debe ser un porcentaje entre 0 y 100.", values };
  }

  return {
    success: true,
    data: {
      sku: values.sku || null,
      name: values.name,
      description: values.description,
      unit: values.unit,
      unitPrice,
      purchaseCost,
      defaultMarginPercentage,
      taxRate,
      notes: values.notes || null,
    },
  };
}

export function parseProductId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parseProductStatus(value: unknown): ProductStatusFilter {
  return value === "inactive" || value === "all" ? value : "active";
}

export function validateProductImport(formData: FormData):
  | { success: true; names: string[] }
  | { success: false; message: string } {
  const rawNames = text(formData, "names");
  if (!rawNames) return { success: false, message: "Selecciona un Excel y confirma la vista previa." };

  let parsed: unknown;
  try { parsed = JSON.parse(rawNames); } catch { return { success: false, message: "La vista previa no es válida." }; }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 2_000) {
    return { success: false, message: "La carga debe contener entre 1 y 2000 productos." };
  }

  const names: string[] = [];
  const seen = new Set<string>();
  for (const value of parsed) {
    if (typeof value !== "string") return { success: false, message: "La lista contiene un producto inválido." };
    const name = value.trim();
    if (!name || name.length > 191) return { success: false, message: "Cada producto debe tener un nombre de máximo 191 caracteres." };
    const key = name.toLocaleLowerCase("es-MX");
    if (!seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  }
  return { success: true, names };
}

export function parseProductNameCsv(content: string): string[][] {
  return content.replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => [line.trim()]);
}
