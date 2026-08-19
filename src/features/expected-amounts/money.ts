export function normalizeMoney(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "number" && !Number.isFinite(value)) return null;

  let raw = typeof value === "number" ? value.toFixed(6) : value.trim();
  let parenthesized = false;
  if (raw.startsWith("(") && raw.endsWith(")")) {
    parenthesized = true;
    raw = raw.slice(1, -1);
  }
  raw = raw.replace(/MXN/gi, "").replace(/[$,\s]/g, "");
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match) return null;

  const negative = parenthesized || match[1] === "-";
  const integer = match[2].replace(/^0+(?=\d)/, "");
  const fraction = (match[3] ?? "").padEnd(3, "0");
  let cents = Number(integer) * 100 + Number(fraction.slice(0, 2));
  if (fraction[2] >= "5") cents += 1;
  if (!Number.isSafeInteger(cents) || cents > 999_999_999_999_999) return null;

  const absolute = cents.toString().padStart(3, "0");
  const normalized = `${absolute.slice(0, -2)}.${absolute.slice(-2)}`;
  return negative && cents !== 0 ? `-${normalized}` : normalized;
}

export function moneyToCents(value: unknown): number | null {
  const normalized = normalizeMoney(value);
  if (!normalized) return null;
  const negative = normalized.startsWith("-");
  const digits = normalized.replace(/[.-]/g, "");
  return Number(digits) * (negative ? -1 : 1);
}

export const DEFAULT_SIMILAR_TOLERANCE = "0.10";

export interface MatchItem { id: number; amount: string }

export function buildMatchPlan(
  expected: MatchItem[],
  deposits: MatchItem[],
  confirmed: { expectedAmountIds?: number[]; bankDepositIds?: number[] } = {},
  tolerance = DEFAULT_SIMILAR_TOLERANCE,
) {
  const usedExpected = new Set(confirmed.expectedAmountIds ?? []);
  const usedDeposits = new Set(confirmed.bankDepositIds ?? []);
  const pendingExpected = expected.filter((item) => !usedExpected.has(item.id));
  const depositQueues = new Map<string, MatchItem[]>();

  for (const deposit of deposits) {
    if (usedDeposits.has(deposit.id)) continue;
    const amount = normalizeMoney(deposit.amount);
    if (!amount) continue;
    const queue = depositQueues.get(amount) ?? [];
    queue.push(deposit);
    depositQueues.set(amount, queue);
  }

  const exactMatches: Array<{ expectedAmountId: number; bankDepositId: number; expectedAmount: string; depositAmount: string; difference: "0.00"; matchType: "exact" }> = [];
  const unmatchedExpected: MatchItem[] = [];
  for (const item of pendingExpected) {
    const amount = normalizeMoney(item.amount);
    const deposit = amount ? depositQueues.get(amount)?.shift() : undefined;
    if (!amount || !deposit) {
      unmatchedExpected.push(item);
      continue;
    }
    usedDeposits.add(deposit.id);
    exactMatches.push({ expectedAmountId: item.id, bankDepositId: deposit.id, expectedAmount: amount, depositAmount: amount, difference: "0.00", matchType: "exact" });
  }

  const remainingDeposits = deposits.filter((item) => !usedDeposits.has(item.id));
  const toleranceCents = moneyToCents(tolerance) ?? 10;
  const similarSuggestions = unmatchedExpected.flatMap((item) => {
    const expectedCents = moneyToCents(item.amount);
    if (expectedCents === null) return [];
    const candidates = remainingDeposits.flatMap((deposit) => {
      const depositCents = moneyToCents(deposit.amount);
      if (depositCents === null) return [];
      const difference = Math.abs(expectedCents - depositCents);
      if (difference === 0 || difference > toleranceCents) return [];
      return [{ bankDepositId: deposit.id, depositAmount: normalizeMoney(deposit.amount)!, difference: `${Math.floor(difference / 100)}.${String(difference % 100).padStart(2, "0")}` }];
    }).sort((a, b) => moneyToCents(a.difference)! - moneyToCents(b.difference)!);
    return candidates.length ? [{ expectedAmountId: item.id, candidates }] : [];
  });

  return { exactMatches, similarSuggestions, unmatchedExpected, remainingDeposits };
}
