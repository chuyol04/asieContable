import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";
import type { AccountingPeriod, PeriodFilters, PeriodInput, PeriodStatus } from "./types";

interface PeriodRow extends RowDataPacket {
  id: number;
  company_id: number;
  company_name: string;
  month: number;
  year: number;
  status: PeriodStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

const columns = "p.id, p.company_id, c.name AS company_name, p.month, p.year, p.status, p.notes, p.created_at, p.updated_at";

function toPeriod(row: PeriodRow): AccountingPeriod {
  return { id: row.id, companyId: row.company_id, companyName: row.company_name, month: row.month, year: row.year, status: row.status, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function listAccountingPeriods(filters: PeriodFilters): Promise<AccountingPeriod[]> {
  const conditions: string[] = ["p.archived_at IS NULL"];
  const parameters: Array<string | number> = [];
  const search = filters.search.trim().slice(0, 191);

  if (search) {
    const value = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push("(c.name LIKE ? OR p.notes LIKE ? OR CONCAT(p.month, '/', p.year) LIKE ?)");
    parameters.push(value, value, value);
  }
  if (filters.companyId) {
    conditions.push("p.company_id = ?");
    parameters.push(filters.companyId);
  }
  if (filters.year) {
    conditions.push("p.year = ?");
    parameters.push(filters.year);
  }
  if (filters.status !== "all") {
    conditions.push("p.status = ?");
    parameters.push(filters.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await getMysqlPool().execute<PeriodRow[]>(
    `SELECT ${columns} FROM accounting_periods p INNER JOIN companies c ON c.id = p.company_id ${where} ORDER BY p.year DESC, p.month DESC, c.name`,
    parameters,
  );
  return rows.map(toPeriod);
}

export async function getAccountingPeriod(id: number): Promise<AccountingPeriod | null> {
  const [rows] = await getMysqlPool().execute<PeriodRow[]>(
    `SELECT ${columns} FROM accounting_periods p INNER JOIN companies c ON c.id = p.company_id WHERE p.id = ? AND p.archived_at IS NULL LIMIT 1`,
    [id],
  );
  return rows[0] ? toPeriod(rows[0]) : null;
}

export async function createAccountingPeriod(input: PeriodInput): Promise<number> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    "INSERT INTO accounting_periods (company_id, month, year, status, notes) VALUES (?, ?, ?, 'open', ?)",
    [input.companyId, input.month, input.year, input.notes],
  );
  return result.insertId;
}

export async function updatePeriodNotes(id: number, notes: string | null): Promise<void> {
  await getMysqlPool().execute("UPDATE accounting_periods SET notes = ? WHERE id = ? AND archived_at IS NULL", [notes, id]);
}

export async function updatePeriodStatus(id: number, status: PeriodStatus): Promise<void> {
  await getMysqlPool().execute("UPDATE accounting_periods SET status = ? WHERE id = ? AND archived_at IS NULL", [status, id]);
}

export async function archiveAccountingPeriod(id: number, companyId: number): Promise<"archived" | "has-data" | "not-found"> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    `UPDATE accounting_periods p SET archived_at = CURRENT_TIMESTAMP
     WHERE p.id = ? AND p.company_id = ? AND p.archived_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM expected_amount_imports i WHERE i.accounting_period_id = p.id)
       AND NOT EXISTS (SELECT 1 FROM expected_amounts e WHERE e.accounting_period_id = p.id)
       AND NOT EXISTS (SELECT 1 FROM bank_deposits d WHERE d.accounting_period_id = p.id)
       AND NOT EXISTS (SELECT 1 FROM deposit_batches b WHERE b.accounting_period_id = p.id)
       AND NOT EXISTS (SELECT 1 FROM cash_deliveries c WHERE c.accounting_period_id = p.id)`,
    [id, companyId],
  );
  if (result.affectedRows) return "archived";
  const [rows] = await getMysqlPool().execute<RowDataPacket[]>("SELECT id FROM accounting_periods WHERE id = ? AND company_id = ? AND archived_at IS NULL LIMIT 1", [id, companyId]);
  return rows[0] ? "has-data" : "not-found";
}

export function isDuplicatePeriod(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}
