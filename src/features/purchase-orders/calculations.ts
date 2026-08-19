import { normalizeMoney } from "../expected-amounts/money.ts";

export interface CalculableItem { quantity: string; unitPrice: string; discount: string; taxRate: string }
export interface CalculatedItem extends CalculableItem { subtotal: string; taxAmount: string; total: string }

const zero = BigInt(0);
const tenThousand = BigInt(10_000);
const maxCents = BigInt(999_999_999_999_999);

export function normalizeQuantity(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim().replace(/,/g, "");
  const match = /^(\d+)(?:\.(\d{1,4}))?$/.exec(raw);
  if (!match) return null;
  const integer = match[1].replace(/^0+(?=\d)/, "");
  const fraction = (match[2] ?? "").padEnd(4, "0");
  const units = BigInt(integer) * tenThousand + BigInt(fraction);
  if (units <= zero || units > BigInt(999_999_999_999_999)) return null;
  return `${integer}.${fraction}`;
}

export function calculatePurchaseOrderItem(item: CalculableItem): CalculatedItem {
  const quantity = normalizeQuantity(item.quantity);
  const unitPrice = normalizeMoney(item.unitPrice);
  const discount = normalizeMoney(item.discount);
  const taxRate = normalizeMoney(item.taxRate);
  if (!quantity || !unitPrice || !discount || !taxRate) throw new Error("INVALID_AMOUNT");
  const quantityUnits = fixedToBigInt(quantity);
  const priceCents = fixedToBigInt(unitPrice);
  const discountCents = fixedToBigInt(discount);
  const taxBasisPoints = fixedToBigInt(taxRate);
  if (priceCents < zero || discountCents < zero || taxBasisPoints < zero || taxBasisPoints > tenThousand) throw new Error("INVALID_AMOUNT");
  const subtotalCents = divideRounded(quantityUnits * priceCents, tenThousand);
  if (discountCents > subtotalCents) throw new Error("DISCOUNT_EXCEEDS_SUBTOTAL");
  const taxableCents = subtotalCents - discountCents;
  const taxCents = divideRounded(taxableCents * taxBasisPoints, tenThousand);
  const totalCents = taxableCents + taxCents;
  if ([subtotalCents, taxCents, totalCents].some((value) => value > maxCents)) throw new Error("AMOUNT_TOO_LARGE");
  return { quantity, unitPrice, discount, taxRate, subtotal: centsToMoney(subtotalCents), taxAmount: centsToMoney(taxCents), total: centsToMoney(totalCents) };
}

export function calculatePurchaseOrder(items: CalculableItem[]) {
  const calculatedItems = items.map(calculatePurchaseOrderItem);
  const subtotal = calculatedItems.reduce((sum, item) => sum + fixedToBigInt(item.subtotal), zero);
  const discountTotal = calculatedItems.reduce((sum, item) => sum + fixedToBigInt(item.discount), zero);
  const taxTotal = calculatedItems.reduce((sum, item) => sum + fixedToBigInt(item.taxAmount), zero);
  const total = subtotal - discountTotal + taxTotal;
  if ([subtotal, discountTotal, taxTotal, total].some((value) => value > maxCents)) throw new Error("AMOUNT_TOO_LARGE");
  return { items: calculatedItems, subtotal: centsToMoney(subtotal), discountTotal: centsToMoney(discountTotal), taxTotal: centsToMoney(taxTotal), total: centsToMoney(total) };
}

function fixedToBigInt(value: string): bigint { return BigInt(value.replace(".", "")); }
function divideRounded(value: bigint, divisor: bigint): bigint { return (value + divisor / BigInt(2)) / divisor; }
function centsToMoney(value: bigint): string { const raw = value.toString().padStart(3, "0"); return `${raw.slice(0, -2)}.${raw.slice(-2)}`; }
