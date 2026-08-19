import type { RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";
import type { PurchaseOrderIdentityInput, PurchaseOrderSettings, PurchaseOrderSettingsInput } from "./types";

interface SettingsRow extends RowDataPacket {
  id: number;
  company_id: number;
  logo_url: string | null;
  order_prefix: string | null;
  next_order_number: number;
  default_tax_rate: string;
  header_text: string | null;
  footer_text: string | null;
  left_signature_text: string;
  right_signature_text: string;
  default_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

const columns = "id, company_id, logo_url, order_prefix, next_order_number, default_tax_rate, header_text, footer_text, left_signature_text, right_signature_text, default_notes, created_at, updated_at";

function toSettings(row: SettingsRow): PurchaseOrderSettings {
  return { id: row.id, companyId: row.company_id, logoUrl: row.logo_url, orderPrefix: row.order_prefix, nextOrderNumber: Number(row.next_order_number), defaultTaxRate: row.default_tax_rate, headerText: row.header_text, footerText: row.footer_text, leftSignatureText: row.left_signature_text, rightSignatureText: row.right_signature_text, defaultNotes: row.default_notes, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function getPurchaseOrderSettings(companyId: number): Promise<PurchaseOrderSettings | null> {
  const [rows] = await getMysqlPool().execute<SettingsRow[]>(`SELECT ${columns} FROM purchase_order_settings WHERE company_id = ? LIMIT 1`, [companyId]);
  return rows[0] ? toSettings(rows[0]) : null;
}

export async function getPurchaseOrderLogoReference(companyId: number): Promise<string | null> {
  const [rows] = await getMysqlPool().execute<Array<RowDataPacket & { logo_url: string | null }>>("SELECT logo_url FROM purchase_order_settings WHERE company_id = ? LIMIT 1", [companyId]);
  return rows[0]?.logo_url ?? null;
}

export async function savePurchaseOrderSettings(companyId: number, identity: PurchaseOrderIdentityInput, settings: PurchaseOrderSettingsInput): Promise<void> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const [companies] = await connection.execute<RowDataPacket[]>("SELECT id FROM companies WHERE id = ? FOR UPDATE", [companyId]);
    if (!companies[0]) throw new Error("COMPANY_NOT_FOUND");
    await connection.execute("UPDATE companies SET name = ?, legal_name = ?, tax_id = ?, phone = ?, email = ?, fiscal_address = ? WHERE id = ?", [identity.name, identity.legalName, identity.taxId, identity.phone, identity.email, identity.fiscalAddress, companyId]);
    await connection.execute(
      `INSERT INTO purchase_order_settings
        (company_id, logo_url, order_prefix, next_order_number, default_tax_rate, header_text, footer_text, left_signature_text, right_signature_text, default_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE logo_url = VALUES(logo_url), order_prefix = VALUES(order_prefix), next_order_number = VALUES(next_order_number), default_tax_rate = VALUES(default_tax_rate), header_text = VALUES(header_text), footer_text = VALUES(footer_text), left_signature_text = VALUES(left_signature_text), right_signature_text = VALUES(right_signature_text), default_notes = VALUES(default_notes)`,
      [companyId, settings.logoUrl, settings.orderPrefix, settings.nextOrderNumber, settings.defaultTaxRate, settings.headerText, settings.footerText, settings.leftSignatureText, settings.rightSignatureText, settings.defaultNotes],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function isDuplicateCompanyName(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}
