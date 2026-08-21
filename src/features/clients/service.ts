import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";

import type { Client, ClientInput, ClientStatusFilter, PayrollFile } from "./types";

interface ClientRow extends RowDataPacket {
  id: number; name: string; legal_name: string | null; tax_id: string | null; user_email: string;
  firebase_uid: string; phone: string | null; website: string | null; notes: string | null;
  drive_folder_id: string | null; is_active: 0 | 1; created_at: Date; updated_at: Date;
}

interface PayrollRow extends RowDataPacket {
  id: number; client_id: number; file_name: string; file_type: "pdf" | "xls" | "xlsx";
  drive_file_id: string; drive_url: string; payroll_date: Date | string | null; period_month: number;
  period_year: number; notes: string | null; uploaded_at: Date; is_active: 0 | 1;
}

const clientColumns = "id, name, legal_name, tax_id, user_email, firebase_uid, phone, website, notes, drive_folder_id, is_active, created_at, updated_at";
const payrollColumns = "id, client_id, file_name, file_type, drive_file_id, drive_url, payroll_date, period_month, period_year, notes, uploaded_at, is_active";

function toClient(row: ClientRow): Client {
  return { id: row.id, name: row.name, legalName: row.legal_name, taxId: row.tax_id, userEmail: row.user_email, firebaseUid: row.firebase_uid, phone: row.phone, website: row.website, notes: row.notes, driveFolderId: row.drive_folder_id, isActive: Boolean(row.is_active), createdAt: row.created_at, updatedAt: row.updated_at };
}

function dateOnly(value: Date | string | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function toPayroll(row: PayrollRow): PayrollFile {
  return { id: row.id, clientId: row.client_id, fileName: row.file_name, fileType: row.file_type, driveFileId: row.drive_file_id, driveUrl: row.drive_url, payrollDate: dateOnly(row.payroll_date), periodMonth: row.period_month, periodYear: row.period_year, notes: row.notes, uploadedAt: row.uploaded_at, isActive: Boolean(row.is_active) };
}

export async function listClients(search = "", status: ClientStatusFilter = "active"): Promise<Client[]> {
  const conditions: string[] = [];
  const values: Array<string | number> = [];
  const normalized = search.trim().slice(0, 191);
  if (normalized) {
    const value = `%${normalized.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push("(name LIKE ? OR legal_name LIKE ? OR tax_id LIKE ? OR user_email LIKE ?)");
    values.push(value, value, value, value);
  }
  if (status !== "all") { conditions.push("is_active = ?"); values.push(status === "active" ? 1 : 0); }
  const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await getMysqlPool().execute<ClientRow[]>(`SELECT ${clientColumns} FROM clients${where} ORDER BY name`, values);
  return rows.map(toClient);
}

export async function getClient(clientId: number): Promise<Client | null> {
  const [rows] = await getMysqlPool().execute<ClientRow[]>(`SELECT ${clientColumns} FROM clients WHERE id = ? LIMIT 1`, [clientId]);
  return rows[0] ? toClient(rows[0]) : null;
}

export async function getClientForUser(firebaseUid: string, email: string | undefined): Promise<Client | null> {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const [rows] = await getMysqlPool().execute<ClientRow[]>(
    `SELECT ${clientColumns} FROM clients WHERE is_active = 1 AND (firebase_uid = ? OR user_email = ?) LIMIT 1`,
    [firebaseUid, normalizedEmail],
  );
  return rows[0] ? toClient(rows[0]) : null;
}

export async function createClient(input: ClientInput): Promise<number> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    "INSERT INTO clients (name, legal_name, tax_id, user_email, firebase_uid, phone, website, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [input.name, input.legalName, input.taxId, input.userEmail, input.firebaseUid, input.phone, input.website, input.notes],
  );
  return result.insertId;
}

export async function rollbackNewClient(clientId: number): Promise<void> {
  await getMysqlPool().execute("DELETE FROM clients WHERE id = ?", [clientId]);
}

export async function updateClient(clientId: number, input: ClientInput): Promise<boolean> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    "UPDATE clients SET name = ?, legal_name = ?, tax_id = ?, user_email = ?, firebase_uid = ?, phone = ?, website = ?, notes = ? WHERE id = ?",
    [input.name, input.legalName, input.taxId, input.userEmail, input.firebaseUid, input.phone, input.website, input.notes, clientId],
  );
  return result.affectedRows > 0;
}

export async function setClientActive(clientId: number, active: boolean): Promise<boolean> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>("UPDATE clients SET is_active = ? WHERE id = ?", [active ? 1 : 0, clientId]);
  return result.affectedRows > 0;
}

export async function saveClientDriveFolder(clientId: number, folderId: string): Promise<void> {
  await getMysqlPool().execute("UPDATE clients SET drive_folder_id = ? WHERE id = ?", [folderId, clientId]);
}

export async function listPayrollFiles(clientId: number, filters: { year?: number | null; month?: number | null; name?: string; date?: string | null; activeOnly?: boolean } = {}): Promise<PayrollFile[]> {
  const conditions = ["client_id = ?"];
  const values: Array<number | string> = [clientId];
  if (filters.year) { conditions.push("period_year = ?"); values.push(filters.year); }
  if (filters.month) { conditions.push("period_month = ?"); values.push(filters.month); }
  if (filters.name) {
    conditions.push("file_name LIKE ?");
    values.push(`%${filters.name.replace(/[\\%_]/g, "\\$&")}%`);
  }
  if (filters.date) { conditions.push("payroll_date = ?"); values.push(filters.date); }
  if (filters.activeOnly) conditions.push("is_active = 1");
  const [rows] = await getMysqlPool().execute<PayrollRow[]>(
    `SELECT ${payrollColumns} FROM client_payroll_files WHERE ${conditions.join(" AND ")} ORDER BY period_year DESC, period_month DESC, uploaded_at DESC`,
    values,
  );
  return rows.map(toPayroll);
}

export async function getPayrollFile(payrollFileId: number): Promise<PayrollFile | null> {
  const [rows] = await getMysqlPool().execute<PayrollRow[]>(`SELECT ${payrollColumns} FROM client_payroll_files WHERE id = ? LIMIT 1`, [payrollFileId]);
  return rows[0] ? toPayroll(rows[0]) : null;
}

export async function getPayrollFileForClient(clientId: number, payrollFileId: number): Promise<PayrollFile | null> {
  const [rows] = await getMysqlPool().execute<PayrollRow[]>(`SELECT ${payrollColumns} FROM client_payroll_files WHERE id = ? AND client_id = ? LIMIT 1`, [payrollFileId, clientId]);
  return rows[0] ? toPayroll(rows[0]) : null;
}

export async function createPayrollFile(input: {
  clientId: number; fileName: string; fileType: "pdf" | "xls" | "xlsx"; driveFileId: string;
  driveUrl: string; payrollDate: string | null; periodMonth: number; periodYear: number; notes: string | null;
}): Promise<number> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    "INSERT INTO client_payroll_files (client_id, file_name, file_type, drive_file_id, drive_url, payroll_date, period_month, period_year, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [input.clientId, input.fileName, input.fileType, input.driveFileId, input.driveUrl, input.payrollDate, input.periodMonth, input.periodYear, input.notes],
  );
  return result.insertId;
}

export async function setPayrollFileActive(clientId: number, payrollFileId: number, active: boolean): Promise<boolean> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>("UPDATE client_payroll_files SET is_active = ? WHERE id = ? AND client_id = ?", [active ? 1 : 0, payrollFileId, clientId]);
  return result.affectedRows > 0;
}

export async function deletePayrollFile(clientId: number, payrollFileId: number): Promise<boolean> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>("DELETE FROM client_payroll_files WHERE id = ? AND client_id = ?", [payrollFileId, clientId]);
  return result.affectedRows > 0;
}

export function isDuplicateClient(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}
