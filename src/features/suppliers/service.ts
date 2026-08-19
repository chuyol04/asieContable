import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";
import type { Supplier, SupplierInput, SupplierStatusFilter } from "./types";

interface SupplierRow extends RowDataPacket {
  id: number; company_id: number; legal_name: string; tax_id: string | null; fiscal_address: string | null;
  phone: string | null; is_active: 0 | 1; created_at: Date; updated_at: Date;
}

const columns = "id, company_id, legal_name, tax_id, fiscal_address, phone, is_active, created_at, updated_at";
function toSupplier(row: SupplierRow): Supplier { return { id: row.id, companyId: row.company_id, legalName: row.legal_name, taxId: row.tax_id, fiscalAddress: row.fiscal_address, phone: row.phone, isActive: Boolean(row.is_active), createdAt: row.created_at, updatedAt: row.updated_at }; }

export async function listSuppliers(companyId: number, search = "", status: SupplierStatusFilter = "active"): Promise<Supplier[]> {
  const conditions = ["company_id = ?"];
  const values: Array<string | number> = [companyId];
  const normalizedSearch = search.trim().slice(0, 255);
  if (normalizedSearch) { const value = `%${normalizedSearch.replace(/[\\%_]/g, "\\$&")}%`; conditions.push("(legal_name LIKE ? OR tax_id LIKE ?)"); values.push(value, value); }
  if (status !== "all") { conditions.push("is_active = ?"); values.push(status === "active" ? 1 : 0); }
  const [rows] = await getMysqlPool().execute<SupplierRow[]>(`SELECT ${columns} FROM suppliers WHERE ${conditions.join(" AND ")} ORDER BY legal_name`, values);
  return rows.map(toSupplier);
}

export async function getSupplier(companyId: number, supplierId: number): Promise<Supplier | null> {
  const [rows] = await getMysqlPool().execute<SupplierRow[]>(`SELECT ${columns} FROM suppliers WHERE id = ? AND company_id = ? LIMIT 1`, [supplierId, companyId]);
  return rows[0] ? toSupplier(rows[0]) : null;
}

export async function createSupplier(companyId: number, input: SupplierInput): Promise<number> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>("INSERT INTO suppliers (company_id, legal_name, tax_id, fiscal_address, phone) VALUES (?, ?, ?, ?, ?)", [companyId, input.legalName, input.taxId, input.fiscalAddress, input.phone]);
  return result.insertId;
}

export async function updateSupplier(companyId: number, supplierId: number, input: SupplierInput): Promise<boolean> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>("UPDATE suppliers SET legal_name = ?, tax_id = ?, fiscal_address = ?, phone = ? WHERE id = ? AND company_id = ?", [input.legalName, input.taxId, input.fiscalAddress, input.phone, supplierId, companyId]);
  return result.affectedRows > 0;
}

export async function setSupplierActive(companyId: number, supplierId: number, active: boolean): Promise<boolean> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>("UPDATE suppliers SET is_active = ? WHERE id = ? AND company_id = ?", [active ? 1 : 0, supplierId, companyId]);
  return result.affectedRows > 0;
}

export function isDuplicateSupplier(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY"; }
