import { parseDepositDate, parseDepositId } from "../bank-deposits/validation.ts";
import { moneyToCents, normalizeMoney } from "../expected-amounts/money.ts";
import type { DeliveryFormValues, DeliveryInput } from "./types";

type ValidationResult = { success: true; data: DeliveryInput } | { success: false; message: string; values: DeliveryFormValues };

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function parseDeliveryId(value: unknown): number | null { return parseDepositId(value); }

export function validateDeliveryForm(formData: FormData): ValidationResult {
  const values = { companyId: text(formData, "companyId"), accountingPeriodId: text(formData, "accountingPeriodId"), deliveryDate: text(formData, "deliveryDate"), storedAmount: text(formData, "storedAmount"), amount: text(formData, "amount"), deliveredBy: text(formData, "deliveredBy"), receivedBy: text(formData, "receivedBy"), notes: text(formData, "notes") };
  const companyId = parseDeliveryId(values.companyId);
  const accountingPeriodId = parseDeliveryId(values.accountingPeriodId);
  const deliveryDate = parseDepositDate(values.deliveryDate);
  const storedAmount = normalizeMoney(values.storedAmount);
  const amount = normalizeMoney(values.amount);
  if (!companyId || !accountingPeriodId || !deliveryDate) return { success: false, message: "Empresa, periodo y fecha son obligatorios.", values };
  if (!storedAmount || (moneyToCents(storedAmount) ?? 0) <= 0 || !amount || (moneyToCents(amount) ?? 0) <= 0) return { success: false, message: "Los montos guardado y entregado deben ser mayores a cero.", values };
  if ((moneyToCents(amount) ?? 0) > (moneyToCents(storedAmount) ?? 0)) return { success: false, message: "El monto entregado no puede superar el monto guardado.", values };
  if (!values.deliveredBy || !values.receivedBy) return { success: false, message: "Indica quién entrega y quién recibe.", values };
  if (values.deliveredBy.length > 191 || values.receivedBy.length > 191 || values.notes.length > 5_000) return { success: false, message: "Los nombres o las observaciones son demasiado largos.", values };
  return { success: true, data: { companyId, accountingPeriodId, deliveryDate, storedAmount, amount, deliveredBy: values.deliveredBy, receivedBy: values.receivedBy, notes: values.notes || null } };
}

interface SignaturePoint { x: number; y: number }

export function validateSignature(value: unknown): SignaturePoint[][] | null {
  if (typeof value !== "string" || value.length > 200_000) return null;
  try {
    const strokes = JSON.parse(value);
    if (!Array.isArray(strokes) || !strokes.length || strokes.length > 100) return null;
    let points = 0;
    for (const stroke of strokes) {
      if (!Array.isArray(stroke) || !stroke.length) return null;
      points += stroke.length;
      if (points > 5_000 || stroke.some((point) => typeof point !== "object" || point === null || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 600 || point.y < 0 || point.y > 200)) return null;
    }
    return strokes;
  } catch {
    return null;
  }
}
