import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { listDeposits } from "@/features/bank-deposits/service";
import { buildMatchPlan, DEFAULT_SIMILAR_TOLERANCE, moneyToCents, normalizeMoney } from "@/features/expected-amounts/money";
import { listExpectedAmounts } from "@/features/expected-amounts/service";
import { getMysqlPool } from "@/lib/database/mysql";
import type { MatchCandidate, MatchType, ReconciliationRecord, ReconciliationWorkspace } from "./types";
import { signedDifference } from "./validation";

interface ReconciliationDbRow extends RowDataPacket {
  id: number; expected_amount_id: number; bank_deposit_id: number; match_type: MatchType;
  expected_amount: string; deposit_amount: string; difference: string; confirmed_at: Date;
}

interface MoneyRow extends RowDataPacket { id: number; amount: string }
interface MatchContextRow extends RowDataPacket {
  expected_amount: string; deposit_amount: string; accounting_period_id: number;
  expected_company_id: number; deposit_company_id: number; deposit_status: "available" | "reconciled";
}

async function tolerance(connection?: PoolConnection): Promise<string> {
  const executor = connection ?? getMysqlPool();
  const [rows] = await executor.execute<(RowDataPacket & { setting_value: string })[]>("SELECT setting_value FROM system_settings WHERE setting_key='reconciliation_similar_tolerance' LIMIT 1");
  return normalizeMoney(rows[0]?.setting_value) ?? DEFAULT_SIMILAR_TOLERANCE;
}

export async function getReconciliationWorkspace(accountingPeriodId: number): Promise<ReconciliationWorkspace> {
  const [expectedAmounts, deposits, reconciliationRows, configuredTolerance] = await Promise.all([
    listExpectedAmounts(accountingPeriodId),
    listDeposits({ companyId: null, accountingPeriodId, bankAccountId: null, depositDate: null, status: null, batchId: null }),
    getMysqlPool().execute<ReconciliationDbRow[]>("SELECT r.id, r.expected_amount_id, r.bank_deposit_id, r.match_type, r.expected_amount, r.deposit_amount, r.difference, r.confirmed_at FROM reconciliations r INNER JOIN expected_amounts e ON e.id=r.expected_amount_id WHERE e.accounting_period_id=? ORDER BY r.id", [accountingPeriodId]).then(([rows]) => rows),
    tolerance(),
  ]);
  const depositsById = new Map(deposits.map((deposit) => [deposit.id, deposit]));
  const reconciliations = reconciliationRows.flatMap((row): ReconciliationRecord[] => {
    const deposit = depositsById.get(row.bank_deposit_id);
    return deposit ? [{ id: row.id, expectedAmountId: row.expected_amount_id, bankDepositId: row.bank_deposit_id, matchType: row.match_type, expectedAmount: row.expected_amount, depositAmount: row.deposit_amount, difference: row.difference, confirmedAt: row.confirmed_at, deposit }] : [];
  });
  const reconciliationByExpected = new Map(reconciliations.map((item) => [item.expectedAmountId, item]));
  const reconciledDepositIds = new Set(reconciliations.map((item) => item.bankDepositId));
  const availableDeposits = deposits.filter((deposit) => deposit.status === "available" && !reconciledDepositIds.has(deposit.id));
  const pendingExpected = expectedAmounts.filter((item) => !reconciliationByExpected.has(item.id));
  const plan = buildMatchPlan(pendingExpected, availableDeposits, {}, configuredTolerance);
  const exactByExpected = new Map(plan.exactMatches.map((match) => [match.expectedAmountId, match]));
  const suggestionsByExpected = new Map(plan.similarSuggestions.map((suggestion) => [suggestion.expectedAmountId, suggestion.candidates]));

  const rows = expectedAmounts.map((expected) => {
    const exact = exactByExpected.get(expected.id);
    const exactDeposit = exact ? depositsById.get(exact.bankDepositId) : undefined;
    const exactCandidate: MatchCandidate | null = exactDeposit ? { deposit: exactDeposit, difference: "0.00", absoluteDifferenceCents: 0 } : null;
    const similarCandidates = (suggestionsByExpected.get(expected.id) ?? []).flatMap((candidate): MatchCandidate[] => {
      const deposit = depositsById.get(candidate.bankDepositId);
      const difference = deposit ? signedDifference(expected.amount, deposit.amount) : null;
      return deposit && difference ? [{ deposit, difference: difference.value, absoluteDifferenceCents: difference.absoluteCents }] : [];
    }).sort((a, b) => a.absoluteDifferenceCents - b.absoluteDifferenceCents);
    return { expected, reconciliation: reconciliationByExpected.get(expected.id) ?? null, exactCandidate, similarCandidates };
  });
  const totalExpectedCents = expectedAmounts.reduce((sum, item) => sum + (moneyToCents(item.amount) ?? 0), 0);
  const totalReceivedCents = deposits.reduce((sum, item) => sum + (moneyToCents(item.amount) ?? 0), 0);
  const totalReconciledCents = reconciliations.reduce((sum, item) => sum + (moneyToCents(item.expectedAmount) ?? 0), 0);
  return { tolerance: configuredTolerance, rows, availableDeposits, exactMatchCount: plan.exactMatches.length, similarSuggestionCount: plan.similarSuggestions.length, totalExpectedCents, totalReceivedCents, totalReconciledCents };
}

async function pendingItems(connection: PoolConnection, accountingPeriodId: number) {
  const [expected] = await connection.execute<MoneyRow[]>("SELECT e.id, e.amount FROM expected_amounts e WHERE e.accounting_period_id=? AND NOT EXISTS (SELECT 1 FROM reconciliations r WHERE r.expected_amount_id=e.id) ORDER BY e.id FOR UPDATE", [accountingPeriodId]);
  const [deposits] = await connection.execute<MoneyRow[]>("SELECT d.id, d.amount FROM bank_deposits d WHERE d.accounting_period_id=? AND d.status='available' AND NOT EXISTS (SELECT 1 FROM reconciliations r WHERE r.bank_deposit_id=d.id) ORDER BY d.id FOR UPDATE", [accountingPeriodId]);
  return { expected, deposits };
}

export async function processExactReconciliations(accountingPeriodId: number): Promise<number> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const items = await pendingItems(connection, accountingPeriodId);
    const matches = buildMatchPlan(items.expected, items.deposits).exactMatches;
    if (matches.length) {
      const placeholders = matches.map(() => "(?, ?, 'exact', ?, ?, ?, 'confirmed')").join(", ");
      const parameters = matches.flatMap((match) => [match.expectedAmountId, match.bankDepositId, match.expectedAmount, match.depositAmount, match.difference]);
      await connection.execute<ResultSetHeader>(`INSERT INTO reconciliations (expected_amount_id, bank_deposit_id, match_type, expected_amount, deposit_amount, difference, status) VALUES ${placeholders}`, parameters);
      await connection.execute(`UPDATE bank_deposits SET status='reconciled' WHERE id IN (${matches.map(() => "?").join(", ")})`, matches.map((match) => match.bankDepositId));
    }
    await connection.commit();
    return matches.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function confirmReconciliation(accountingPeriodId: number, expectedAmountId: number, bankDepositId: number, matchType: Exclude<MatchType, "exact">): Promise<number> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const [contexts] = await connection.execute<MatchContextRow[]>("SELECT e.amount AS expected_amount, d.amount AS deposit_amount, e.accounting_period_id, p.company_id AS expected_company_id, d.company_id AS deposit_company_id, d.status AS deposit_status FROM expected_amounts e INNER JOIN accounting_periods p ON p.id=e.accounting_period_id INNER JOIN bank_deposits d ON d.id=? WHERE e.id=? FOR UPDATE", [bankDepositId, expectedAmountId]);
    const context = contexts[0];
    if (!context || context.accounting_period_id !== accountingPeriodId || context.expected_company_id !== context.deposit_company_id) throw new Error("INVALID_CONTEXT");
    const [depositPeriod] = await connection.execute<(RowDataPacket & { accounting_period_id: number })[]>("SELECT accounting_period_id FROM bank_deposits WHERE id=?", [bankDepositId]);
    if (depositPeriod[0]?.accounting_period_id !== context.accounting_period_id) throw new Error("INVALID_CONTEXT");
    if (context.deposit_status !== "available") throw new Error("DEPOSIT_UNAVAILABLE");
    const items = await pendingItems(connection, context.accounting_period_id);
    if (buildMatchPlan(items.expected, items.deposits).exactMatches.length) throw new Error("EXACTS_PENDING");
    const difference = signedDifference(context.expected_amount, context.deposit_amount);
    if (!difference) throw new Error("INVALID_AMOUNT");
    if (matchType === "similar") {
      const toleranceCents = moneyToCents(await tolerance(connection)) ?? 10;
      if (difference.absoluteCents === 0 || difference.absoluteCents > toleranceCents) throw new Error("OUTSIDE_TOLERANCE");
    }
    await connection.execute("INSERT INTO reconciliations (expected_amount_id, bank_deposit_id, match_type, expected_amount, deposit_amount, difference, status) VALUES (?, ?, ?, ?, ?, ?, 'confirmed')", [expectedAmountId, bankDepositId, matchType, context.expected_amount, context.deposit_amount, difference.value]);
    await connection.execute("UPDATE bank_deposits SET status='reconciled' WHERE id=? AND status='available'", [bankDepositId]);
    await connection.commit();
    return context.accounting_period_id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function undoReconciliation(accountingPeriodId: number, reconciliationId: number): Promise<number> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<(RowDataPacket & { bank_deposit_id: number; accounting_period_id: number })[]>("SELECT r.bank_deposit_id, e.accounting_period_id FROM reconciliations r INNER JOIN expected_amounts e ON e.id=r.expected_amount_id WHERE r.id=? FOR UPDATE", [reconciliationId]);
    if (!rows[0] || rows[0].accounting_period_id !== accountingPeriodId) throw new Error("RECONCILIATION_NOT_FOUND");
    await connection.execute("DELETE FROM reconciliations WHERE id=?", [reconciliationId]);
    await connection.execute("UPDATE bank_deposits SET status='available' WHERE id=?", [rows[0].bank_deposit_id]);
    await connection.commit();
    return rows[0].accounting_period_id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function reconciliationErrorCode(error: unknown): string | null {
  if (error instanceof Error && ["INVALID_CONTEXT", "DEPOSIT_UNAVAILABLE", "EXACTS_PENDING", "INVALID_AMOUNT", "OUTSIDE_TOLERANCE", "RECONCILIATION_NOT_FOUND"].includes(error.message)) return error.message;
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY" ? "ALREADY_RECONCILED" : null;
}
