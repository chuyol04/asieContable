import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { moneyToCents } from "@/features/expected-amounts/money";
import { getMysqlPool } from "@/lib/database/mysql";
import { deleteSignatureFile, writeSignatureFile } from "./signature-storage";
import type { CashDelivery, CashDeliveryStatus, DeliveryInput, DeliverySummary } from "./types";

interface DeliveryRow extends RowDataPacket {
  id: number; company_id: number; company_name: string; accounting_period_id: number; period_month: number; period_year: number;
  delivery_date: string | Date; stored_amount: string; amount: string; delivered_by: string; received_by: string; notes: string | null; status: CashDeliveryStatus;
  signature_reference: string | null; signed_at: Date | null; created_at: Date; updated_at: Date;
}

interface SummaryRow extends RowDataPacket { total_stored: string; total_delivered: string; delivery_count: number }

const columns = "d.id, d.company_id, c.name AS company_name, d.accounting_period_id, p.month AS period_month, p.year AS period_year, d.delivery_date, d.stored_amount, d.amount, d.delivered_by, d.received_by, d.notes, d.status, d.signature_reference, d.signed_at, d.created_at, d.updated_at";

function dateOnly(value: string | Date): string { return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10); }
function centsToMoney(cents: number): string { return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`; }
function toDelivery(row: DeliveryRow): CashDelivery { return { id: row.id, companyId: row.company_id, companyName: row.company_name, accountingPeriodId: row.accounting_period_id, periodMonth: row.period_month, periodYear: row.period_year, deliveryDate: dateOnly(row.delivery_date), storedAmount: row.stored_amount, amount: row.amount, deliveredBy: row.delivered_by, receivedBy: row.received_by, notes: row.notes, status: row.status, signatureReference: row.signature_reference, signedAt: row.signed_at, createdAt: row.created_at, updatedAt: row.updated_at }; }

export async function listCashDeliveries(accountingPeriodId: number): Promise<CashDelivery[]> {
  const [rows] = await getMysqlPool().execute<DeliveryRow[]>(`SELECT ${columns} FROM cash_deliveries d INNER JOIN companies c ON c.id=d.company_id INNER JOIN accounting_periods p ON p.id=d.accounting_period_id WHERE d.accounting_period_id=? AND p.archived_at IS NULL ORDER BY d.delivery_date DESC, d.id DESC`, [accountingPeriodId]);
  return rows.map(toDelivery);
}

export async function getCashDelivery(id: number): Promise<CashDelivery | null> {
  const [rows] = await getMysqlPool().execute<DeliveryRow[]>(`SELECT ${columns} FROM cash_deliveries d INNER JOIN companies c ON c.id=d.company_id INNER JOIN accounting_periods p ON p.id=d.accounting_period_id WHERE d.id=? AND p.archived_at IS NULL LIMIT 1`, [id]);
  return rows[0] ? toDelivery(rows[0]) : null;
}

export async function getDeliverySummary(accountingPeriodId: number): Promise<DeliverySummary> {
  const [rows] = await getMysqlPool().execute<SummaryRow[]>("SELECT COALESCE(SUM(CASE WHEN status<>'cancelled' THEN stored_amount ELSE 0 END),0) AS total_stored, COALESCE(SUM(CASE WHEN status<>'cancelled' THEN amount ELSE 0 END),0) AS total_delivered, COUNT(*) AS delivery_count FROM cash_deliveries WHERE accounting_period_id=?", [accountingPeriodId]);
  return summary(rows[0]);
}

function summary(row: SummaryRow | undefined): DeliverySummary {
  const stored = moneyToCents(row?.total_stored ?? "0") ?? 0;
  const delivered = moneyToCents(row?.total_delivered ?? "0") ?? 0;
  return { totalStored: centsToMoney(stored), totalDelivered: centsToMoney(delivered), pendingBalance: centsToMoney(Math.max(0, stored - delivered)), deliveryCount: Number(row?.delivery_count ?? 0) };
}

async function lockPeriod(connection: PoolConnection, input: Pick<DeliveryInput, "companyId" | "accountingPeriodId">) {
  const [rows] = await connection.execute<(RowDataPacket & { company_id: number; status: string })[]>("SELECT company_id,status FROM accounting_periods WHERE id=? AND archived_at IS NULL FOR UPDATE", [input.accountingPeriodId]);
  if (!rows[0] || rows[0].company_id !== input.companyId) throw new Error("INVALID_CONTEXT");
  if (rows[0].status === "closed") throw new Error("PERIOD_CLOSED");
}

export async function createCashDelivery(input: DeliveryInput): Promise<number> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    await lockPeriod(connection, input);
    const [result] = await connection.execute<ResultSetHeader>("INSERT INTO cash_deliveries (company_id,accounting_period_id,delivery_date,stored_amount,amount,delivered_by,received_by,notes,status) VALUES (?,?,?,?,?,?,?,?,'pending_signature')", [input.companyId, input.accountingPeriodId, input.deliveryDate, input.storedAmount, input.amount, input.deliveredBy, input.receivedBy, input.notes]);
    await connection.commit();
    return result.insertId;
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

export async function updateCashDelivery(id: number, input: DeliveryInput): Promise<void> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    await lockPeriod(connection, input);
    const [rows] = await connection.execute<(RowDataPacket & { company_id: number; accounting_period_id: number; status: CashDeliveryStatus })[]>("SELECT company_id,accounting_period_id,status FROM cash_deliveries WHERE id=? FOR UPDATE", [id]);
    if (!rows[0]) throw new Error("DELIVERY_NOT_FOUND");
    if (rows[0].status !== "pending_signature") throw new Error("DELIVERY_LOCKED");
    if (rows[0].company_id !== input.companyId || rows[0].accounting_period_id !== input.accountingPeriodId) throw new Error("INVALID_CONTEXT");
    await connection.execute("UPDATE cash_deliveries SET delivery_date=?,stored_amount=?,amount=?,delivered_by=?,received_by=?,notes=? WHERE id=? AND status='pending_signature'", [input.deliveryDate, input.storedAmount, input.amount, input.deliveredBy, input.receivedBy, input.notes, id]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

export async function cancelCashDelivery(id: number): Promise<number> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const [initial] = await connection.execute<(RowDataPacket & { company_id: number; accounting_period_id: number })[]>("SELECT company_id,accounting_period_id FROM cash_deliveries WHERE id=?", [id]);
    if (!initial[0]) throw new Error("DELIVERY_NOT_FOUND");
    await lockPeriod(connection, { companyId: initial[0].company_id, accountingPeriodId: initial[0].accounting_period_id });
    const [rows] = await connection.execute<(RowDataPacket & { status: CashDeliveryStatus })[]>("SELECT status FROM cash_deliveries WHERE id=? FOR UPDATE", [id]);
    if (!rows[0] || rows[0].status === "cancelled") throw new Error("DELIVERY_LOCKED");
    await connection.execute("UPDATE cash_deliveries SET status='cancelled' WHERE id=?", [id]);
    await connection.commit();
    return initial[0].accounting_period_id;
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

export async function saveDeliverySignature(id: number, strokes: Array<Array<{ x: number; y: number }>>): Promise<number> {
  const connection = await getMysqlPool().getConnection();
  let reference: string | null = null;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<(RowDataPacket & { accounting_period_id: number; status: CashDeliveryStatus })[]>("SELECT accounting_period_id,status FROM cash_deliveries WHERE id=? FOR UPDATE", [id]);
    if (!rows[0]) throw new Error("DELIVERY_NOT_FOUND");
    if (rows[0].status !== "pending_signature") throw new Error("DELIVERY_LOCKED");
    reference = await writeSignatureFile(id, strokes);
    await connection.execute("UPDATE cash_deliveries SET signature_reference=?,signed_at=CURRENT_TIMESTAMP,status='confirmed' WHERE id=? AND status='pending_signature'", [reference, id]);
    await connection.commit();
    return rows[0].accounting_period_id;
  } catch (error) { await connection.rollback(); if (reference) await deleteSignatureFile(reference); throw error; } finally { connection.release(); }
}

export async function getDeliverySignatureReference(id: number): Promise<string | null> {
  const [rows] = await getMysqlPool().execute<(RowDataPacket & { signature_reference: string | null })[]>("SELECT signature_reference FROM cash_deliveries WHERE id=? LIMIT 1", [id]);
  return rows[0]?.signature_reference ?? null;
}

export function deliveryErrorCode(error: unknown): string | null {
  if (error instanceof Error && ["INVALID_CONTEXT", "PERIOD_CLOSED", "DELIVERY_NOT_FOUND", "DELIVERY_LOCKED"].includes(error.message)) return error.message;
  return null;
}
