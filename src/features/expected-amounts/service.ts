import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";
import type { ExpectedAmount, ExpectedAmountImport, ExpectedImportRow } from "./types";

interface ExpectedRow extends RowDataPacket {
  id: number; accounting_period_id: number; import_id: number; source_row_number: number;
  amount: string; reference_data: string | Record<string, string>; match_type: ExpectedAmount["matchType"]; created_at: Date;
}

interface ImportRow extends RowDataPacket {
  id: number; accounting_period_id: number; source_name: string | null; amount_column: string;
  row_count: number; reconciled_count: number; created_at: Date;
}

export async function listExpectedAmountImports(accountingPeriodId: number): Promise<ExpectedAmountImport[]> {
  const [rows] = await getMysqlPool().execute<ImportRow[]>(
    `SELECT i.id, i.accounting_period_id, i.source_name, i.amount_column, i.row_count, i.created_at,
            COUNT(r.id) AS reconciled_count
     FROM expected_amount_imports i
     LEFT JOIN expected_amounts e ON e.import_id = i.id
     LEFT JOIN reconciliations r ON r.expected_amount_id = e.id
     WHERE i.accounting_period_id = ?
     GROUP BY i.id, i.accounting_period_id, i.source_name, i.amount_column, i.row_count, i.created_at
     ORDER BY i.id DESC`,
    [accountingPeriodId],
  );
  return rows.map((row) => ({ id: row.id, accountingPeriodId: row.accounting_period_id, sourceName: row.source_name, amountColumn: row.amount_column, rowCount: Number(row.row_count), reconciledCount: Number(row.reconciled_count), createdAt: row.created_at }));
}

export async function listExpectedAmounts(accountingPeriodId: number): Promise<ExpectedAmount[]> {
  const [rows] = await getMysqlPool().execute<ExpectedRow[]>(
    `SELECT e.id, e.accounting_period_id, e.import_id, e.source_row_number, e.amount,
            e.reference_data, r.match_type, e.created_at
     FROM expected_amounts e
     LEFT JOIN reconciliations r ON r.expected_amount_id = e.id
     WHERE e.accounting_period_id = ?
     ORDER BY e.import_id, e.source_row_number`,
    [accountingPeriodId],
  );
  return rows.map((row) => ({ id: row.id, accountingPeriodId: row.accounting_period_id, importId: row.import_id, sourceRowNumber: row.source_row_number, amount: row.amount, referenceData: typeof row.reference_data === "string" ? JSON.parse(row.reference_data) : row.reference_data, matchType: row.match_type, createdAt: row.created_at }));
}

export async function importExpectedAmounts(accountingPeriodId: number, sourceName: string | null, amountColumn: string, rows: ExpectedImportRow[]): Promise<number> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(
      "INSERT INTO expected_amount_imports (accounting_period_id, source_name, amount_column, row_count) VALUES (?, ?, ?, ?)",
      [accountingPeriodId, sourceName, amountColumn, rows.length],
    );
    for (const row of rows) {
      await connection.execute(
        "INSERT INTO expected_amounts (accounting_period_id, import_id, source_row_number, amount, reference_data) VALUES (?, ?, ?, ?, ?)",
        [accountingPeriodId, result.insertId, row.sourceRowNumber, row.amount, JSON.stringify(row.referenceData)],
      );
    }
    await connection.commit();
    return rows.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteExpectedAmountImport(accountingPeriodId: number, importId: number): Promise<"deleted" | "reconciled" | "not-found"> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const [imports] = await connection.execute<RowDataPacket[]>("SELECT i.id FROM expected_amount_imports i INNER JOIN accounting_periods p ON p.id=i.accounting_period_id WHERE i.id=? AND i.accounting_period_id=? AND p.archived_at IS NULL FOR UPDATE", [importId, accountingPeriodId]);
    if (!imports[0]) { await connection.rollback(); return "not-found"; }
    const [matches] = await connection.execute<(RowDataPacket & { total: number })[]>("SELECT COUNT(*) AS total FROM reconciliations r INNER JOIN expected_amounts e ON e.id=r.expected_amount_id WHERE e.import_id=?", [importId]);
    if (Number(matches[0]?.total ?? 0) > 0) { await connection.rollback(); return "reconciled"; }
    await connection.execute("DELETE FROM expected_amounts WHERE import_id=? AND accounting_period_id=?", [importId, accountingPeriodId]);
    await connection.execute("DELETE FROM expected_amount_imports WHERE id=? AND accounting_period_id=?", [importId, accountingPeriodId]);
    await connection.commit();
    return "deleted";
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
