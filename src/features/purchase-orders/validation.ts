import { normalizeMoney } from "../expected-amounts/money.ts";
import { normalizeQuantity } from "./calculations.ts";
import type { PurchaseOrderFormValues, PurchaseOrderInput, PurchaseOrderStatus, PurchaseOrderStatusFilter } from "./types";

type ValidationResult = { success: true; data: PurchaseOrderInput } | { success: false; message: string; values: PurchaseOrderFormValues };

function text(formData: FormData, field: string): string { const value = formData.get(field); return typeof value === "string" ? value.trim() : ""; }
function validDate(value: string): boolean { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T00:00:00Z`); return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value; }

export function validatePurchaseOrderForm(formData: FormData): ValidationResult {
  const values = { orderDate: text(formData, "orderDate"), deliveryDate: text(formData, "deliveryDate"), supplierLegalName: text(formData, "supplierLegalName"), supplierTaxId: text(formData, "supplierTaxId"), supplierAddress: text(formData, "supplierAddress"), supplierPhone: text(formData, "supplierPhone"), notes: text(formData, "notes"), items: text(formData, "items") };
  if (!validDate(values.orderDate) || !validDate(values.deliveryDate)) return { success: false, message: "Las fechas de expedición y entrega son obligatorias y deben ser válidas.", values };
  if (values.deliveryDate < values.orderDate) return { success: false, message: "La fecha de entrega no puede ser anterior a la expedición.", values };
  if (!values.supplierLegalName) return { success: false, message: "La razón social del proveedor es obligatoria.", values };
  if (values.supplierLegalName.length > 255 || values.supplierTaxId.length > 32 || values.supplierPhone.length > 32 || values.supplierAddress.length > 5_000 || values.notes.length > 5_000) return { success: false, message: "Uno de los datos de la orden es demasiado largo.", values };

  let parsed: unknown;
  try { parsed = JSON.parse(values.items); } catch { return { success: false, message: "Las partidas no son válidas.", values }; }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 100) return { success: false, message: "La orden debe contener entre 1 y 100 partidas.", values };
  const items = [];
  for (const raw of parsed) {
    if (!raw || typeof raw !== "object") return { success: false, message: "Una partida no es válida.", values };
    const item = raw as Record<string, unknown>;
    const productId = parsePurchaseOrderId(item.productId);
    const itemId = item.itemId === null || item.itemId === undefined ? null : parsePurchaseOrderId(item.itemId);
    const quantity = normalizeQuantity(item.quantity);
    const unitPrice = normalizeMoney(item.unitPrice);
    const discount = normalizeMoney(item.discount);
    const taxRate = normalizeMoney(item.taxRate === "" || item.taxRate === null || item.taxRate === undefined ? "0" : item.taxRate);
    const numericTaxRate = Number(taxRate);
    if (!productId || (item.itemId !== null && item.itemId !== undefined && !itemId) || !quantity || !unitPrice || !discount || !taxRate || unitPrice.startsWith("-") || discount.startsWith("-") || numericTaxRate < 0 || numericTaxRate > 100) return { success: false, message: "Una partida contiene producto, cantidad, precio, descuento o IVA inválido.", values };
    items.push({ itemId, productId, quantity, unitPrice, discount, taxRate });
  }
  return { success: true, data: { orderDate: values.orderDate, deliveryDate: values.deliveryDate, supplierLegalName: values.supplierLegalName, supplierTaxId: values.supplierTaxId || null, supplierAddress: values.supplierAddress || null, supplierPhone: values.supplierPhone || null, notes: values.notes || null, items } };
}

export function parsePurchaseOrderId(value: unknown): number | null { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null; }
export function parsePurchaseOrderStatus(value: unknown): PurchaseOrderStatusFilter { return value === "draft" || value === "confirmed" || value === "cancelled" ? value : "all"; }
export function parseFilterDate(value: unknown): string | null { return typeof value === "string" && validDate(value) ? value : null; }
export function canTransitionPurchaseOrderStatus(current: PurchaseOrderStatus, target: "confirmed" | "cancelled"): boolean { return current === "draft" ? true : current === "confirmed" && target === "cancelled"; }
