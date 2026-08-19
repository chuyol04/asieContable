import type { RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";
import type {
  BankAccount,
  CompanyDocument,
  CompanyCoverTemplate,
  CompanyDossier,
  CompanyRepresentative,
  DocumentType,
  DocumentFileMetadata,
  DossierFormValues,
  DossierInput,
  DossierSection,
} from "./types";

interface RepresentativeRow extends RowDataPacket {
  id: number; company_id: number; full_name: string; position: string;
  tax_id: string | null; curp: string | null;
  email: string | null; phone: string | null; observations: string | null; is_active: 0 | 1;
}

interface DocumentRow extends RowDataPacket {
  id: number; company_id: number; representative_id: number | null; representative_name: string | null; document_type: DocumentType; document_name: string;
  document_date: string | Date | null; expiration_date: string | Date | null;
  external_url: string | null; observations: string | null; is_active: 0 | 1;
  file_id: string | null; file_name: string | null; file_url: string | null; storage_provider: string | null; uploaded_at: Date | null; created_at: Date;
}

interface AccountRow extends RowDataPacket {
  id: number; company_id: number; bank_id: number; bank_name: string; alias: string;
  account_number: string; clabe: string; branch: string; plaza: string | null;
  currency: string; holder: string; observations: string | null; is_active: 0 | 1;
}

interface CoverTemplateRow extends RowDataPacket {
  id: number; company_id: number; file_id: string; file_name: string; file_url: string; storage_provider: string; uploaded_at: Date;
}

const dossierTables: Record<DossierSection, string> = {
  representantes: "company_representatives",
  documentos: "company_documents",
  cuentas: "bank_accounts",
};

function dateOnly(value: string | Date | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

function toRepresentative(row: RepresentativeRow): CompanyRepresentative {
  return { id: row.id, companyId: row.company_id, fullName: row.full_name, position: row.position, taxId: row.tax_id, curp: row.curp, email: row.email, phone: row.phone, observations: row.observations, isActive: Boolean(row.is_active) };
}

function toDocument(row: DocumentRow): CompanyDocument {
  return { id: row.id, companyId: row.company_id, representativeId: row.representative_id, representativeName: row.representative_name, documentType: row.document_type, documentName: row.document_name, documentDate: dateOnly(row.document_date), expirationDate: dateOnly(row.expiration_date), externalUrl: row.external_url, fileId: row.file_id, fileName: row.file_name, fileUrl: row.file_url, storageProvider: row.storage_provider, uploadedAt: row.uploaded_at, createdAt: row.created_at, observations: row.observations, isActive: Boolean(row.is_active) };
}

function toAccount(row: AccountRow): BankAccount {
  return { id: row.id, companyId: row.company_id, bankId: row.bank_id, bankName: row.bank_name, alias: row.alias, accountNumber: row.account_number, clabe: row.clabe, branch: row.branch, plaza: row.plaza, currency: row.currency, holder: row.holder, observations: row.observations, isActive: Boolean(row.is_active) };
}

export async function getCompanyDossier(companyId: number): Promise<CompanyDossier> {
  const pool = getMysqlPool();
  const [representativeResult, documentResult, accountResult] = await Promise.all([
    pool.execute<RepresentativeRow[]>("SELECT id, company_id, full_name, position, tax_id, curp, email, phone, observations, is_active FROM company_representatives WHERE company_id = ? ORDER BY full_name", [companyId]),
    pool.execute<DocumentRow[]>(`SELECT d.id, d.company_id, d.representative_id, r.full_name AS representative_name, d.document_type, d.document_name, d.document_date, d.expiration_date, d.external_url, d.file_id, d.file_name, d.file_url, d.storage_provider, d.uploaded_at, d.created_at, d.observations, d.is_active FROM company_documents d LEFT JOIN company_representatives r ON r.id=d.representative_id WHERE d.company_id = ? ORDER BY d.created_at DESC, d.document_name`, [companyId]),
    pool.execute<AccountRow[]>("SELECT a.id, a.company_id, a.bank_id, b.name AS bank_name, a.alias, a.account_number, a.clabe, a.branch, a.plaza, a.currency, a.holder, a.observations, a.is_active FROM bank_accounts a INNER JOIN banks b ON b.id = a.bank_id WHERE a.company_id = ? ORDER BY b.name, a.alias", [companyId]),
  ]);
  return {
    representatives: representativeResult[0].map(toRepresentative),
    documents: documentResult[0].map(toDocument),
    bankAccounts: accountResult[0].map(toAccount),
  };
}

export async function getDossierRecord(companyId: number, section: DossierSection, id: number): Promise<DossierFormValues | null> {
  const pool = getMysqlPool();
  if (section === "representantes") {
    const [rows] = await pool.execute<RepresentativeRow[]>("SELECT id, company_id, full_name, position, tax_id, curp, email, phone, observations, is_active FROM company_representatives WHERE id = ? AND company_id = ? LIMIT 1", [id, companyId]);
    const row = rows[0];
    return row ? { fullName: row.full_name, position: row.position, taxId: row.tax_id ?? "", curp: row.curp ?? "", email: row.email ?? "", phone: row.phone ?? "", observations: row.observations ?? "" } : null;
  }
  if (section === "documentos") {
    const [rows] = await pool.execute<DocumentRow[]>(`SELECT d.id, d.company_id, d.representative_id, r.full_name AS representative_name, d.document_type, d.document_name, d.document_date, d.expiration_date, d.external_url, d.file_id, d.file_name, d.file_url, d.storage_provider, d.uploaded_at, d.created_at, d.observations, d.is_active FROM company_documents d LEFT JOIN company_representatives r ON r.id=d.representative_id WHERE d.id = ? AND d.company_id = ? LIMIT 1`, [id, companyId]);
    const row = rows[0];
    return row ? { documentType: row.document_type, documentName: row.document_name, representativeId: row.representative_id ? String(row.representative_id) : "", documentDate: dateOnly(row.document_date) ?? "", expirationDate: dateOnly(row.expiration_date) ?? "", externalUrl: row.external_url ?? "", currentFileName: row.file_name ?? "", observations: row.observations ?? "" } : null;
  }
  const [rows] = await pool.execute<AccountRow[]>("SELECT a.id, a.company_id, a.bank_id, b.name AS bank_name, a.alias, a.account_number, a.clabe, a.branch, a.plaza, a.currency, a.holder, a.observations, a.is_active FROM bank_accounts a INNER JOIN banks b ON b.id = a.bank_id WHERE a.id = ? AND a.company_id = ? LIMIT 1", [id, companyId]);
  const row = rows[0];
  return row ? { bankId: String(row.bank_id), alias: row.alias, accountNumber: row.account_number, clabe: row.clabe, branch: row.branch, plaza: row.plaza ?? "", currency: row.currency, holder: row.holder, observations: row.observations ?? "" } : null;
}

export async function saveDossierRecord(companyId: number, id: number | null, input: DossierInput, documentFile?: DocumentFileMetadata): Promise<void> {
  const pool = getMysqlPool();
  if (input.kind === "representantes") {
    const values = [input.fullName, input.position, input.taxId, input.curp, input.email, input.phone, input.observations];
    await pool.execute(id ? "UPDATE company_representatives SET full_name = ?, position = ?, tax_id = ?, curp = ?, email = ?, phone = ?, observations = ? WHERE id = ? AND company_id = ?" : "INSERT INTO company_representatives (full_name, position, tax_id, curp, email, phone, observations, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", id ? [...values, id, companyId] : [...values, companyId]);
    return;
  }
  if (input.kind === "documentos") {
    const values = [input.representativeId, input.documentType, input.documentName, input.documentDate, input.expirationDate, input.externalUrl, input.observations];
    if (id) {
      await pool.execute(`UPDATE company_documents SET representative_id = ?, document_type = ?, document_name = ?, document_date = ?, expiration_date = ?, external_url = ?, observations = ?${documentFile ? ", file_id = ?, file_name = ?, file_url = ?, storage_provider = ?, uploaded_at = ?" : ""} WHERE id = ? AND company_id = ?`, documentFile ? [...values, documentFile.fileId, documentFile.fileName, documentFile.fileUrl, documentFile.storageProvider, documentFile.uploadedAt, id, companyId] : [...values, id, companyId]);
    } else {
      await pool.execute("INSERT INTO company_documents (representative_id, document_type, document_name, document_date, expiration_date, external_url, observations, file_id, file_name, file_url, storage_provider, uploaded_at, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [...values, documentFile?.fileId ?? null, documentFile?.fileName ?? null, documentFile?.fileUrl ?? null, documentFile?.storageProvider ?? (input.externalUrl ? "external" : null), documentFile?.uploadedAt ?? null, companyId]);
    }
    return;
  }
  const values = [input.bankId, input.alias, input.accountNumber, input.clabe, input.branch, input.plaza, input.currency, input.holder, input.observations];
  await pool.execute(id ? "UPDATE bank_accounts SET bank_id = ?, alias = ?, account_number = ?, clabe = ?, branch = ?, plaza = ?, currency = ?, holder = ?, observations = ? WHERE id = ? AND company_id = ?" : "INSERT INTO bank_accounts (bank_id, alias, account_number, clabe, branch, plaza, currency, holder, observations, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", id ? [...values, id, companyId] : [...values, companyId]);
}

export async function getCompanyDocument(companyId: number, id: number): Promise<CompanyDocument | null> {
  const [rows] = await getMysqlPool().execute<DocumentRow[]>(`SELECT d.id, d.company_id, d.representative_id, r.full_name AS representative_name, d.document_type, d.document_name, d.document_date, d.expiration_date, d.external_url, d.file_id, d.file_name, d.file_url, d.storage_provider, d.uploaded_at, d.created_at, d.observations, d.is_active FROM company_documents d LEFT JOIN company_representatives r ON r.id=d.representative_id WHERE d.id=? AND d.company_id=? LIMIT 1`, [id, companyId]);
  return rows[0] ? toDocument(rows[0]) : null;
}

export async function getCompanyCoverTemplate(companyId: number): Promise<CompanyCoverTemplate | null> {
  const [rows] = await getMysqlPool().execute<CoverTemplateRow[]>("SELECT id, company_id, file_id, file_name, file_url, storage_provider, uploaded_at FROM company_cover_templates WHERE company_id=? LIMIT 1", [companyId]);
  const row = rows[0];
  return row ? { id: row.id, companyId: row.company_id, fileId: row.file_id, fileName: row.file_name, fileUrl: row.file_url, storageProvider: row.storage_provider, uploadedAt: row.uploaded_at } : null;
}

export async function saveCompanyCoverTemplate(companyId: number, file: DocumentFileMetadata): Promise<void> {
  await getMysqlPool().execute(`INSERT INTO company_cover_templates (company_id, file_id, file_name, file_url, storage_provider, uploaded_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE file_id=VALUES(file_id), file_name=VALUES(file_name), file_url=VALUES(file_url), storage_provider=VALUES(storage_provider), uploaded_at=VALUES(uploaded_at)`, [companyId, file.fileId, file.fileName, file.fileUrl, file.storageProvider, file.uploadedAt]);
}

export async function setDossierRecordActive(companyId: number, section: DossierSection, id: number, isActive: boolean): Promise<void> {
  const table = dossierTables[section];
  if (!table) throw new Error("INVALID_DOSSIER_SECTION");
  await getMysqlPool().execute(`UPDATE ${table} SET is_active = ? WHERE id = ? AND company_id = ?`, [isActive ? 1 : 0, id, companyId]);
}

export function isDuplicateAccount(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}
