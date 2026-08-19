import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";
import type { Bank, BankInput, BankStatusFilter } from "./types";

interface BankRow extends RowDataPacket {
  id: number;
  name: string;
  short_name: string | null;
  is_active: 0 | 1;
  created_at: Date;
  updated_at: Date;
}

const columns = "id, name, short_name, is_active, created_at, updated_at";

function toBank(row: BankRow): Bank {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBanks(search: string, status: BankStatusFilter): Promise<Bank[]> {
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
  const [rows] = await getMysqlPool().execute<BankRow[]>(
    `SELECT ${columns} FROM banks ${where} ORDER BY name`,
    parameters,
  );

  return rows.map(toBank);
}

export async function getBank(id: number): Promise<Bank | null> {
  const [rows] = await getMysqlPool().execute<BankRow[]>(
    `SELECT ${columns} FROM banks WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] ? toBank(rows[0]) : null;
}

export async function createBank(input: BankInput): Promise<number> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    "INSERT INTO banks (name, short_name) VALUES (?, ?)",
    [input.name, input.shortName],
  );

  return result.insertId;
}

export async function updateBank(id: number, input: BankInput): Promise<void> {
  await getMysqlPool().execute(
    "UPDATE banks SET name = ?, short_name = ? WHERE id = ?",
    [input.name, input.shortName, id],
  );
}

export async function setBankActive(id: number, isActive: boolean): Promise<void> {
  await getMysqlPool().execute("UPDATE banks SET is_active = ? WHERE id = ?", [
    isActive ? 1 : 0,
    id,
  ]);
}

export function isDuplicateBankName(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}
