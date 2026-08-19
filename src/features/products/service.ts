import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";
import type { Product, ProductInput, ProductStatusFilter } from "./types";

interface ProductRow extends RowDataPacket {
  id: number;
  company_id: number;
  sku: string | null;
  name: string;
  description: string;
  unit: string;
  unit_price: string;
  purchase_cost: string | null;
  default_margin_percentage: string | null;
  tax_rate: string | null;
  notes: string | null;
  is_active: 0 | 1;
  created_at: Date;
  updated_at: Date;
}

const columns = "id, company_id, sku, name, description, unit, unit_price, purchase_cost, default_margin_percentage, tax_rate, notes, is_active, created_at, updated_at";

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    companyId: row.company_id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    unit: row.unit,
    unitPrice: row.unit_price,
    purchaseCost: row.purchase_cost,
    defaultMarginPercentage: row.default_margin_percentage,
    taxRate: row.tax_rate,
    notes: row.notes,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProducts(companyId: number, search: string, status: ProductStatusFilter): Promise<Product[]> {
  const conditions = ["company_id = ?"];
  const parameters: Array<string | number> = [companyId];
  const normalizedSearch = search.trim().slice(0, 191);
  if (normalizedSearch) {
    conditions.push("(name LIKE ? OR sku LIKE ?)");
    const value = `%${normalizedSearch.replace(/[\\%_]/g, "\\$&")}%`;
    parameters.push(value, value);
  }
  if (status !== "all") {
    conditions.push("is_active = ?");
    parameters.push(status === "active" ? 1 : 0);
  }
  const [rows] = await getMysqlPool().execute<ProductRow[]>(
    `SELECT ${columns} FROM products WHERE ${conditions.join(" AND ")} ORDER BY name, sku`,
    parameters,
  );
  return rows.map(toProduct);
}

export async function getProduct(companyId: number, id: number): Promise<Product | null> {
  const [rows] = await getMysqlPool().execute<ProductRow[]>(
    `SELECT ${columns} FROM products WHERE id = ? AND company_id = ? LIMIT 1`,
    [id, companyId],
  );
  return rows[0] ? toProduct(rows[0]) : null;
}

export async function createProduct(companyId: number, input: ProductInput): Promise<number> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    `INSERT INTO products (company_id, sku, name, description, unit, unit_price, purchase_cost, default_margin_percentage, tax_rate, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [companyId, input.sku, input.name, input.description, input.unit, input.unitPrice, input.purchaseCost, input.defaultMarginPercentage, input.taxRate, input.notes],
  );
  return result.insertId;
}

export async function updateProduct(companyId: number, id: number, input: ProductInput): Promise<boolean> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    `UPDATE products SET sku = ?, name = ?, description = ?, unit = ?, unit_price = ?, purchase_cost = ?, default_margin_percentage = ?, tax_rate = ?, notes = ?
     WHERE id = ? AND company_id = ?`,
    [input.sku, input.name, input.description, input.unit, input.unitPrice, input.purchaseCost, input.defaultMarginPercentage, input.taxRate, input.notes, id, companyId],
  );
  return result.affectedRows > 0;
}

export async function setProductActive(companyId: number, id: number, isActive: boolean): Promise<boolean> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    "UPDATE products SET is_active = ? WHERE id = ? AND company_id = ?",
    [isActive ? 1 : 0, id, companyId],
  );
  return result.affectedRows > 0;
}

export function isDuplicateProductReference(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}
