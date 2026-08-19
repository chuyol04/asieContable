import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";
import type { Company, CompanyInput, CompanyStatusFilter } from "./types";

interface CompanyRow extends RowDataPacket {
  id: number;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  fiscal_address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  incorporation_date: string | Date | null;
  notary: string | null;
  deed_number: string | null;
  observations: string | null;
  is_active: 0 | 1;
  created_at: Date;
  updated_at: Date;
}

const columns = `
  id, name, legal_name, tax_id, fiscal_address, phone, email, website,
  incorporation_date, notary, deed_number, observations, is_active, created_at, updated_at
`;

function dateOnly(value: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function toCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    taxId: row.tax_id,
    fiscalAddress: row.fiscal_address,
    phone: row.phone,
    email: row.email,
    phones: row.phone ? [row.phone] : [],
    emails: row.email ? [row.email] : [],
    website: row.website,
    incorporationDate: dateOnly(row.incorporation_date),
    notary: row.notary,
    deedNumber: row.deed_number,
    observations: row.observations,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCompanies(
  search: string,
  status: CompanyStatusFilter,
): Promise<Company[]> {
  const conditions: string[] = [];
  const parameters: Array<string | number> = [];
  const normalizedSearch = search.trim().slice(0, 191);

  if (normalizedSearch) {
    conditions.push("name LIKE ?");
    parameters.push(`%${normalizedSearch.replace(/[\\%_]/g, "\\$&")}%`);
  }

  if (status !== "all") {
    conditions.push("is_active = ?");
    parameters.push(status === "active" ? 1 : 0);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await getMysqlPool().execute<CompanyRow[]>(
    `SELECT ${columns} FROM companies ${where} ORDER BY name`,
    parameters,
  );

  return rows.map(toCompany);
}

export async function getCompany(id: number): Promise<Company | null> {
  const pool = getMysqlPool();
  const [rows, contacts] = await Promise.all([
    pool.execute<CompanyRow[]>(`SELECT ${columns} FROM companies WHERE id = ? LIMIT 1`, [id]),
    pool.execute<(RowDataPacket & { contact_type: "email" | "phone"; contact_value: string })[]>("SELECT contact_type, contact_value FROM company_contacts WHERE company_id = ? AND is_active = TRUE ORDER BY is_primary DESC, id", [id]),
  ]);
  if (!rows[0][0]) return null;
  const company = toCompany(rows[0][0]);
  company.emails = contacts[0].filter((item) => item.contact_type === "email").map((item) => item.contact_value);
  company.phones = contacts[0].filter((item) => item.contact_type === "phone").map((item) => item.contact_value);
  return company;
}

export async function createCompany(input: CompanyInput): Promise<number> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(`INSERT INTO companies
       (name, legal_name, tax_id, fiscal_address, phone, email, website,
        incorporation_date, notary, deed_number, observations)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.name, input.legalName, input.taxId, input.fiscalAddress, input.phones[0] ?? null,
      input.emails[0] ?? null, input.website, input.incorporationDate, input.notary,
      input.deedNumber, input.observations],
    );
    await replaceContacts(connection, result.insertId, input);
    await connection.commit();
    return result.insertId;
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

export async function updateCompany(id: number, input: CompanyInput): Promise<void> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(`UPDATE companies
     SET name = ?, legal_name = ?, tax_id = ?, fiscal_address = ?, phone = ?,
         email = ?, website = ?, incorporation_date = ?, notary = ?,
         deed_number = ?, observations = ?
     WHERE id = ?`,
    [input.name, input.legalName, input.taxId, input.fiscalAddress, input.phones[0] ?? null,
      input.emails[0] ?? null, input.website, input.incorporationDate, input.notary,
      input.deedNumber, input.observations, id],
    );
    await replaceContacts(connection, id, input);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

async function replaceContacts(connection: PoolConnection, companyId: number, input: CompanyInput): Promise<void> {
  await connection.execute("DELETE FROM company_contacts WHERE company_id = ?", [companyId]);
  const contacts = [...input.emails.map((value, index) => ["email", value, index === 0]), ...input.phones.map((value, index) => ["phone", value, index === 0])];
  for (const [type, value, primary] of contacts) await connection.execute("INSERT INTO company_contacts (company_id, contact_type, contact_value, is_primary) VALUES (?, ?, ?, ?)", [companyId, type, value, primary ? 1 : 0]);
}

export async function setCompanyActive(id: number, isActive: boolean): Promise<void> {
  await getMysqlPool().execute("UPDATE companies SET is_active = ? WHERE id = ?", [
    isActive ? 1 : 0,
    id,
  ]);
}

export function isDuplicateCompanyName(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}
