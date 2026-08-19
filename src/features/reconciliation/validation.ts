import { moneyToCents, normalizeMoney } from "../expected-amounts/money.ts";
import type { MatchType } from "./types";

export function parseReconciliationId(value: unknown): number | null {
  const id = typeof value === "string" && value ? Number(value) : value;
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parseMatchType(value: unknown): MatchType | null {
  return value === "exact" || value === "similar" || value === "manual" ? value : null;
}

export function signedDifference(expectedAmount: string, depositAmount: string): { value: string; absoluteCents: number } | null {
  const expected = moneyToCents(expectedAmount);
  const deposit = moneyToCents(depositAmount);
  if (expected === null || deposit === null) return null;
  const cents = deposit - expected;
  const absolute = Math.abs(cents);
  const value = `${cents < 0 ? "-" : ""}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
  return { value, absoluteCents: absolute };
}

export function parseAmountFilter(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? normalizeMoney(value) : null;
}
