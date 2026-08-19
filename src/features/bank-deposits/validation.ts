import { moneyToCents, normalizeMoney } from "../expected-amounts/money.ts";
import type { DepositFormValues, DepositInput, DepositStatus } from "./types";

type ValidationResult =
  | { success: true; data: DepositInput; amounts: string[] }
  | { success: false; message: string; values: DepositFormValues };

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function parseDepositId(value: unknown): number | null {
  const id = typeof value === "string" && value ? Number(value) : value;
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parseDepositDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toISOString().slice(0, 10) === value ? value : null;
}

export function parseDepositStatus(value: unknown): DepositStatus | null {
  return value === "available" || value === "reconciled" ? value : null;
}

export function parseMultipleAmounts(value: string): { amounts: string[]; invalidLines: number[] } {
  const amounts: string[] = [];
  const invalidLines: number[] = [];
  value.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const amount = normalizeMoney(line);
    if (!amount || (moneyToCents(amount) ?? 0) <= 0) invalidLines.push(index + 1);
    else amounts.push(amount);
  });
  return { amounts, invalidLines };
}

export function validateDepositForm(formData: FormData, multiple = false): ValidationResult {
  const values = {
    companyId: text(formData, "companyId"),
    accountingPeriodId: text(formData, "accountingPeriodId"),
    bankAccountId: text(formData, "bankAccountId"),
    amount: text(formData, "amount"),
    amounts: text(formData, "amounts"),
    depositDate: text(formData, "depositDate"),
    reference: text(formData, "reference"),
    notes: text(formData, "notes"),
  };
  const companyId = parseDepositId(values.companyId);
  const accountingPeriodId = parseDepositId(values.accountingPeriodId);
  const bankAccountId = parseDepositId(values.bankAccountId);
  const depositDate = parseDepositDate(values.depositDate);
  if (!companyId || !accountingPeriodId || !bankAccountId || !depositDate) {
    return { success: false, message: "Empresa, periodo, cuenta y fecha son obligatorios.", values };
  }
  if (values.reference.length > 191 || values.notes.length > 5_000) {
    return { success: false, message: "La referencia o las observaciones son demasiado largas.", values };
  }

  let amounts: string[];
  if (multiple) {
    const parsed = parseMultipleAmounts(values.amounts);
    if (parsed.invalidLines.length) return { success: false, message: `Hay importes inválidos en las líneas: ${parsed.invalidLines.join(", ")}.`, values };
    if (!parsed.amounts.length || parsed.amounts.length > 1_000) return { success: false, message: "Captura entre 1 y 1000 importes.", values };
    amounts = parsed.amounts;
  } else {
    const amount = normalizeMoney(values.amount);
    if (!amount || (moneyToCents(amount) ?? 0) <= 0) return { success: false, message: "El monto debe ser mayor a cero.", values };
    amounts = [amount];
  }

  return { success: true, data: { companyId, accountingPeriodId, bankAccountId, depositDate, reference: multiple ? null : values.reference || null, notes: values.notes || null }, amounts };
}
