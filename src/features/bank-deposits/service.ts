import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";
import type { BankAccountOption, BankDeposit, DepositBatchOption, DepositFilters, DepositInput, DepositStatus } from "./types";

interface DepositRow extends RowDataPacket {
  id: number; batch_id: number | null; company_id: number; company_name: string; accounting_period_id: number;
  period_month: number; period_year: number; bank_account_id: number; bank_name: string;
  account_alias: string; amount: string; deposit_date: string | Date; reference: string | null;
  notes: string | null; status: DepositStatus; created_at: Date; updated_at: Date;
}

interface BatchOptionRow extends RowDataPacket {
  id: number; company_id: number; company_name: string; accounting_period_id: number;
  period_month: number; period_year: number; bank_account_id: number; bank_name: string;
  account_alias: string; deposit_date: string | Date;
}

interface AccountOptionRow extends RowDataPacket {
  id: number; company_id: number; bank_name: string; alias: string; account_number: string; is_active: 0 | 1;
}

const columns = "d.id, d.batch_id, d.company_id, c.name AS company_name, d.accounting_period_id, p.month AS period_month, p.year AS period_year, d.bank_account_id, b.name AS bank_name, a.alias AS account_alias, d.amount, d.deposit_date, d.reference, d.notes, d.status, d.created_at, d.updated_at";

function dateOnly(value: string | Date): string {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

function toDeposit(row: DepositRow): BankDeposit {
  return { id: row.id, batchId: row.batch_id, companyId: row.company_id, companyName: row.company_name, accountingPeriodId: row.accounting_period_id, periodMonth: row.period_month, periodYear: row.period_year, bankAccountId: row.bank_account_id, bankName: row.bank_name, accountAlias: row.account_alias, amount: row.amount, depositDate: dateOnly(row.deposit_date), reference: row.reference, notes: row.notes, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function listDeposits(filters: DepositFilters): Promise<BankDeposit[]> {
  const conditions: string[] = ["p.archived_at IS NULL"];
  const parameters: Array<string | number> = [];
  if (filters.companyId) { conditions.push("d.company_id = ?"); parameters.push(filters.companyId); }
  if (filters.accountingPeriodId) { conditions.push("d.accounting_period_id = ?"); parameters.push(filters.accountingPeriodId); }
  if (filters.bankAccountId) { conditions.push("d.bank_account_id = ?"); parameters.push(filters.bankAccountId); }
  if (filters.depositDate) { conditions.push("d.deposit_date = ?"); parameters.push(filters.depositDate); }
  if (filters.status) { conditions.push("d.status = ?"); parameters.push(filters.status); }
  if (filters.batchId) { conditions.push("d.batch_id = ?"); parameters.push(filters.batchId); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await getMysqlPool().execute<DepositRow[]>(
    `SELECT ${columns} FROM bank_deposits d INNER JOIN companies c ON c.id=d.company_id INNER JOIN accounting_periods p ON p.id=d.accounting_period_id INNER JOIN bank_accounts a ON a.id=d.bank_account_id INNER JOIN banks b ON b.id=a.bank_id ${where} ORDER BY d.deposit_date DESC, d.id DESC`,
    parameters,
  );
  return rows.map(toDeposit);
}

export async function getDeposit(id: number): Promise<BankDeposit | null> {
  const [rows] = await getMysqlPool().execute<DepositRow[]>(
    `SELECT ${columns} FROM bank_deposits d INNER JOIN companies c ON c.id=d.company_id INNER JOIN accounting_periods p ON p.id=d.accounting_period_id INNER JOIN bank_accounts a ON a.id=d.bank_account_id INNER JOIN banks b ON b.id=a.bank_id WHERE d.id=? AND p.archived_at IS NULL LIMIT 1`, [id],
  );
  return rows[0] ? toDeposit(rows[0]) : null;
}

export async function listBankAccountOptions(companyId?: number): Promise<BankAccountOption[]> {
  const [rows] = await getMysqlPool().execute<AccountOptionRow[]>(`SELECT a.id, a.company_id, b.name AS bank_name, a.alias, a.account_number, a.is_active FROM bank_accounts a INNER JOIN banks b ON b.id=a.bank_id${companyId ? " WHERE a.company_id=?" : ""} ORDER BY b.name, a.alias`, companyId ? [companyId] : []);
  return rows.map((row) => ({ id: row.id, companyId: row.company_id, bankName: row.bank_name, alias: row.alias, accountNumber: row.account_number, isActive: Boolean(row.is_active) }));
}

export async function listDepositBatchOptions(companyId?: number): Promise<DepositBatchOption[]> {
  const [rows] = await getMysqlPool().execute<BatchOptionRow[]>(
    `SELECT d.id, d.company_id, c.name AS company_name, d.accounting_period_id, p.month AS period_month, p.year AS period_year, d.bank_account_id, b.name AS bank_name, a.alias AS account_alias, d.deposit_date FROM deposit_batches d INNER JOIN companies c ON c.id=d.company_id INNER JOIN accounting_periods p ON p.id=d.accounting_period_id INNER JOIN bank_accounts a ON a.id=d.bank_account_id INNER JOIN banks b ON b.id=a.bank_id WHERE p.archived_at IS NULL${companyId ? " AND d.company_id=?" : ""} ORDER BY d.id DESC`,
    companyId ? [companyId] : [],
  );
  return rows.map((row) => ({ id: row.id, companyId: row.company_id, companyName: row.company_name, accountingPeriodId: row.accounting_period_id, periodMonth: row.period_month, periodYear: row.period_year, bankAccountId: row.bank_account_id, bankName: row.bank_name, accountAlias: row.account_alias, depositDate: dateOnly(row.deposit_date) }));
}

async function lockAndValidateContext(connection: PoolConnection, input: DepositInput): Promise<void> {
  const [rows] = await connection.execute<(RowDataPacket & { period_company_id: number; account_company_id: number; period_status: string })[]>(
    "SELECT p.company_id AS period_company_id, a.company_id AS account_company_id, p.status AS period_status FROM accounting_periods p INNER JOIN bank_accounts a ON a.id=? WHERE p.id=? AND p.archived_at IS NULL FOR UPDATE",
    [input.bankAccountId, input.accountingPeriodId],
  );
  const context = rows[0];
  if (!context || context.period_company_id !== input.companyId || context.account_company_id !== input.companyId) throw new Error("INVALID_CONTEXT");
  if (context.period_status === "closed") throw new Error("PERIOD_CLOSED");
}

export async function createDeposits(input: DepositInput, amounts: string[], batched = false): Promise<void> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    await lockAndValidateContext(connection, input);
    let batchId: number | null = null;
    if (batched) {
      const [batch] = await connection.execute<ResultSetHeader>("INSERT INTO deposit_batches (company_id, accounting_period_id, bank_account_id, deposit_date) VALUES (?, ?, ?, ?)", [input.companyId, input.accountingPeriodId, input.bankAccountId, input.depositDate]);
      batchId = batch.insertId;
    }
    for (const amount of amounts) {
      await connection.execute("INSERT INTO bank_deposits (batch_id, company_id, accounting_period_id, bank_account_id, amount, deposit_date, reference, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')", [batchId, input.companyId, input.accountingPeriodId, input.bankAccountId, amount, input.depositDate, input.reference, input.notes]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateDeposit(id: number, input: DepositInput, amount: string): Promise<void> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<(RowDataPacket & { status: DepositStatus; batch_id: number | null; batch_company_id: number | null; batch_period_id: number | null; batch_account_id: number | null; batch_deposit_date: string | Date | null })[]>("SELECT d.status, d.batch_id, b.company_id AS batch_company_id, b.accounting_period_id AS batch_period_id, b.bank_account_id AS batch_account_id, b.deposit_date AS batch_deposit_date FROM bank_deposits d LEFT JOIN deposit_batches b ON b.id=d.batch_id WHERE d.id=? FOR UPDATE", [id]);
    if (!rows[0]) throw new Error("DEPOSIT_NOT_FOUND");
    if (rows[0].status !== "available") throw new Error("DEPOSIT_RECONCILED");
    if (rows[0].batch_id && (rows[0].batch_company_id !== input.companyId || rows[0].batch_period_id !== input.accountingPeriodId || rows[0].batch_account_id !== input.bankAccountId || !rows[0].batch_deposit_date || dateOnly(rows[0].batch_deposit_date) !== input.depositDate)) throw new Error("INVALID_BATCH_CONTEXT");
    await lockAndValidateContext(connection, input);
    await connection.execute("UPDATE bank_deposits SET company_id=?, accounting_period_id=?, bank_account_id=?, amount=?, deposit_date=?, reference=?, notes=? WHERE id=? AND status='available'", [input.companyId, input.accountingPeriodId, input.bankAccountId, amount, input.depositDate, input.reference, input.notes, id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function depositErrorCode(error: unknown): string | null {
  if (error instanceof Error && ["INVALID_CONTEXT", "INVALID_BATCH_CONTEXT", "PERIOD_CLOSED", "DEPOSIT_RECONCILED", "DEPOSIT_NOT_FOUND"].includes(error.message)) return error.message;
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY" ? "DUPLICATE_REFERENCE" : null;
}
