import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";
import { calculatePurchaseOrder, calculatePurchaseOrderItem } from "./calculations";
import type { PurchaseOrder, PurchaseOrderDetail, PurchaseOrderDriveDocument, PurchaseOrderFilters, PurchaseOrderInput, PurchaseOrderItem, PurchaseOrderItemDraft, PurchaseOrderStatus } from "./types";

interface OrderRow extends RowDataPacket {
  id: number; company_id: number; company_name: string; order_sequence: number; order_number: string;
  order_date: string | Date; delivery_date: string | Date; supplier_legal_name: string; supplier_tax_id: string | null;
  supplier_address: string | null; supplier_phone: string | null; subtotal: string; discount_total: string;
  tax_total: string; total: string; notes: string | null; status: PurchaseOrderStatus;
  drive_file_id: string | null; drive_file_name: string | null; drive_url: string | null; drive_folder_id: string | null;
  drive_uploaded_at: Date | null; sent_to_accounting_at: Date | null; created_at: Date; updated_at: Date;
}

interface ItemRow extends RowDataPacket {
  id: number; purchase_order_id: number; product_id: number | null; product_reference: string | null; product_name: string;
  description: string; unit: string; quantity: string; unit_price: string; discount: string; tax_rate: string;
  subtotal: string; tax_amount: string; total: string;
}

interface ProductSnapshotRow extends RowDataPacket {
  id: number; sku: string | null; name: string; description: string; unit: string;
}

interface ResolvedItem {
  productId: number | null; productReference: string | null; productName: string; description: string; unit: string;
  quantity: string; unitPrice: string; discount: string; taxRate: string; subtotal: string; taxAmount: string; total: string;
}

const orderColumns = "o.id, o.company_id, c.name AS company_name, o.order_sequence, o.order_number, o.order_date, o.delivery_date, o.supplier_legal_name, o.supplier_tax_id, o.supplier_address, o.supplier_phone, o.subtotal, o.discount_total, o.tax_total, o.total, o.notes, o.status, o.drive_file_id, o.drive_file_name, o.drive_url, o.drive_folder_id, o.drive_uploaded_at, o.sent_to_accounting_at, o.created_at, o.updated_at";
const itemColumns = "id, purchase_order_id, product_id, product_reference, product_name, description, unit, quantity, unit_price, discount, tax_rate, subtotal, tax_amount, total";

function dateOnly(value: string | Date): string { return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10); }
function toOrder(row: OrderRow): PurchaseOrder { return { id: row.id, companyId: row.company_id, companyName: row.company_name, orderSequence: Number(row.order_sequence), orderNumber: row.order_number, orderDate: dateOnly(row.order_date), deliveryDate: dateOnly(row.delivery_date), supplierLegalName: row.supplier_legal_name, supplierTaxId: row.supplier_tax_id, supplierAddress: row.supplier_address, supplierPhone: row.supplier_phone, subtotal: row.subtotal, discountTotal: row.discount_total, taxTotal: row.tax_total, total: row.total, notes: row.notes, status: row.status, driveFileId: row.drive_file_id, driveFileName: row.drive_file_name, driveUrl: row.drive_url, driveFolderId: row.drive_folder_id, driveUploadedAt: row.drive_uploaded_at, sentToAccountingAt: row.sent_to_accounting_at, createdAt: row.created_at, updatedAt: row.updated_at }; }
function toItem(row: ItemRow): PurchaseOrderItem { return { id: row.id, purchaseOrderId: row.purchase_order_id, productId: row.product_id, productReference: row.product_reference, productName: row.product_name, description: row.description, unit: row.unit, quantity: row.quantity, unitPrice: row.unit_price, discount: row.discount, taxRate: row.tax_rate, subtotal: row.subtotal, taxAmount: row.tax_amount, total: row.total }; }

export async function listPurchaseOrders(filters: PurchaseOrderFilters): Promise<PurchaseOrder[]> {
  const conditions: string[] = [];
  const parameters: Array<string | number> = [];
  const search = filters.search.trim().slice(0, 255);
  if (search) { conditions.push("(o.order_number LIKE ? OR o.supplier_legal_name LIKE ?)"); const value = `%${search.replace(/[\\%_]/g, "\\$&")}%`; parameters.push(value, value); }
  if (filters.companyId) { conditions.push("o.company_id = ?"); parameters.push(filters.companyId); }
  if (filters.dateFrom) { conditions.push("o.order_date >= ?"); parameters.push(filters.dateFrom); }
  if (filters.dateTo) { conditions.push("o.order_date <= ?"); parameters.push(filters.dateTo); }
  if (filters.status !== "all") { conditions.push("o.status = ?"); parameters.push(filters.status); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await getMysqlPool().execute<OrderRow[]>(`SELECT ${orderColumns} FROM purchase_orders o INNER JOIN companies c ON c.id = o.company_id ${where} ORDER BY o.order_date DESC, o.id DESC`, parameters);
  return rows.map(toOrder);
}

export async function getPurchaseOrder(id: number): Promise<PurchaseOrderDetail | null> {
  const [orderResult, itemResult] = await Promise.all([
    getMysqlPool().execute<OrderRow[]>(`SELECT ${orderColumns} FROM purchase_orders o INNER JOIN companies c ON c.id = o.company_id WHERE o.id = ? LIMIT 1`, [id]),
    getMysqlPool().execute<ItemRow[]>(`SELECT ${itemColumns} FROM purchase_order_items WHERE purchase_order_id = ? ORDER BY id`, [id]),
  ]);
  const row = orderResult[0][0];
  return row ? { ...toOrder(row), items: itemResult[0].map(toItem) } : null;
}

export async function createPurchaseOrder(companyId: number, input: PurchaseOrderInput): Promise<number> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const [settings] = await connection.execute<Array<RowDataPacket & { order_prefix: string | null; next_order_number: number }>>("SELECT order_prefix, next_order_number FROM purchase_order_settings WHERE company_id = ? FOR UPDATE", [companyId]);
    if (!settings[0]) throw new PurchaseOrderError("SETTINGS_REQUIRED");
    const resolved = await resolveItems(connection, companyId, input.items, []);
    const totals = calculatePurchaseOrder(resolved);
    const sequence = Number(settings[0].next_order_number);
    if (!Number.isSafeInteger(sequence) || sequence < 1) throw new PurchaseOrderError("INVALID_SEQUENCE");
    const orderNumber = settings[0].order_prefix ? `${settings[0].order_prefix}-${sequence}` : String(sequence);
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO purchase_orders (company_id, order_sequence, order_number, order_date, delivery_date, supplier_legal_name, supplier_tax_id, supplier_address, supplier_phone, subtotal, discount_total, tax_total, total, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, sequence, orderNumber, input.orderDate, input.deliveryDate, input.supplierLegalName, input.supplierTaxId, input.supplierAddress, input.supplierPhone, totals.subtotal, totals.discountTotal, totals.taxTotal, totals.total, input.notes],
    );
    await insertItems(connection, result.insertId, resolved);
    await connection.execute("UPDATE purchase_order_settings SET next_order_number = ? WHERE company_id = ?", [sequence + 1, companyId]);
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function updatePurchaseOrder(id: number, input: PurchaseOrderInput): Promise<void> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute<Array<RowDataPacket & { company_id: number; status: PurchaseOrderStatus }>>("SELECT company_id, status FROM purchase_orders WHERE id = ? FOR UPDATE", [id]);
    const order = orders[0];
    if (!order) throw new PurchaseOrderError("ORDER_NOT_FOUND");
    if (order.status !== "draft") throw new PurchaseOrderError("ORDER_LOCKED");
    const [existingRows] = await connection.execute<ItemRow[]>(`SELECT ${itemColumns} FROM purchase_order_items WHERE purchase_order_id = ?`, [id]);
    const existing = existingRows.map(toItem);
    const resolved = await resolveItems(connection, order.company_id, input.items, existing);
    const totals = calculatePurchaseOrder(resolved);
    await connection.execute("DELETE FROM purchase_order_items WHERE purchase_order_id = ?", [id]);
    await insertItems(connection, id, resolved);
    await connection.execute(
      "UPDATE purchase_orders SET order_date = ?, delivery_date = ?, supplier_legal_name = ?, supplier_tax_id = ?, supplier_address = ?, supplier_phone = ?, subtotal = ?, discount_total = ?, tax_total = ?, total = ?, notes = ? WHERE id = ?",
      [input.orderDate, input.deliveryDate, input.supplierLegalName, input.supplierTaxId, input.supplierAddress, input.supplierPhone, totals.subtotal, totals.discountTotal, totals.taxTotal, totals.total, input.notes, id],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function setPurchaseOrderStatus(id: number, target: "confirmed" | "cancelled"): Promise<boolean> {
  const sql = target === "confirmed"
    ? "UPDATE purchase_orders SET status = 'confirmed' WHERE id = ? AND status = 'draft'"
    : "UPDATE purchase_orders SET status = 'cancelled', drive_file_id = NULL, drive_file_name = NULL, drive_url = NULL, drive_folder_id = NULL, drive_uploaded_at = NULL, sent_to_accounting_at = NULL WHERE id = ? AND status IN ('draft', 'confirmed')";
  const [result] = await getMysqlPool().execute<ResultSetHeader>(sql, [id]);
  return result.affectedRows > 0;
}

export async function savePurchaseOrderDriveDocument(id: number, document: PurchaseOrderDriveDocument, expectedFileId: string | null): Promise<boolean> {
  const condition = expectedFileId ? "drive_file_id = ?" : "drive_file_id IS NULL";
  const parameters = [document.fileId, document.fileName, document.url, document.folderId, id, ...(expectedFileId ? [expectedFileId] : [])];
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    `UPDATE purchase_orders SET drive_file_id = ?, drive_file_name = ?, drive_url = ?, drive_folder_id = ?, drive_uploaded_at = CURRENT_TIMESTAMP
     WHERE id = ? AND status = 'confirmed' AND ${condition}`,
    parameters,
  );
  return result.affectedRows > 0;
}

export async function markPurchaseOrderSentToAccounting(id: number): Promise<boolean> {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    "UPDATE purchase_orders SET sent_to_accounting_at = COALESCE(sent_to_accounting_at, CURRENT_TIMESTAMP) WHERE id = ? AND status = 'confirmed' AND drive_file_id IS NOT NULL",
    [id],
  );
  return result.affectedRows > 0;
}

async function resolveItems(connection: PoolConnection, companyId: number, drafts: PurchaseOrderItemDraft[], existingItems: PurchaseOrderItem[]): Promise<ResolvedItem[]> {
  const existing = new Map(existingItems.map((item) => [item.id, item]));
  const newProductIds = [...new Set(drafts.filter((item) => !item.itemId).map((item) => item.productId))];
  const products = new Map<number, ProductSnapshotRow>();
  if (newProductIds.length) {
    const placeholders = newProductIds.map(() => "?").join(", ");
    const [rows] = await connection.execute<ProductSnapshotRow[]>(`SELECT id, sku, name, description, unit FROM products WHERE company_id = ? AND is_active = 1 AND id IN (${placeholders})`, [companyId, ...newProductIds]);
    rows.forEach((row) => products.set(row.id, row));
  }
  return drafts.map((draft) => {
    const previous = draft.itemId ? existing.get(draft.itemId) : null;
    const product = draft.itemId ? null : products.get(draft.productId);
    if (draft.itemId && (!previous || previous.productId !== draft.productId)) throw new PurchaseOrderError("INVALID_ITEM");
    if (!draft.itemId && !product) throw new PurchaseOrderError("INVALID_PRODUCT");
    const snapshot = previous ? { productId: previous.productId, productReference: previous.productReference, productName: previous.productName, description: previous.description, unit: previous.unit } : { productId: product!.id, productReference: product!.sku, productName: product!.name, description: product!.description, unit: product!.unit };
    const calculated = calculatePurchaseOrderItem({ quantity: draft.quantity, unitPrice: draft.unitPrice, discount: draft.discount, taxRate: draft.taxRate });
    return { ...snapshot, unit: draft.unit, ...calculated };
  });
}

async function insertItems(connection: PoolConnection, orderId: number, items: ResolvedItem[]): Promise<void> {
  const placeholders = items.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
  const values = items.flatMap((item) => [orderId, item.productId, item.productReference, item.productName, item.description, item.unit, item.quantity, item.unitPrice, item.discount, item.taxRate, item.subtotal, item.taxAmount, item.total]);
  await connection.execute(`INSERT INTO purchase_order_items (purchase_order_id, product_id, product_reference, product_name, description, unit, quantity, unit_price, discount, tax_rate, subtotal, tax_amount, total) VALUES ${placeholders}`, values);
}

export class PurchaseOrderError extends Error { constructor(public code: string) { super(code); } }
export function purchaseOrderErrorCode(error: unknown): string {
  if (error instanceof PurchaseOrderError) return error.code;
  if (error instanceof Error && ["DISCOUNT_EXCEEDS_SUBTOTAL", "AMOUNT_TOO_LARGE", "INVALID_AMOUNT"].includes(error.message)) return error.message;
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY" ? "DUPLICATE_NUMBER" : "SAVE_FAILED";
}
