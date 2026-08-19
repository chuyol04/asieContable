import type { RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "@/lib/database/mysql";
import type {
  DashboardMetrics,
  DashboardReport,
  DeliveryReportRow,
  DeliveryReportStatus,
  OrderReportStatus,
  ProductOrderRow,
  ProductSalesRow,
  ProfitReport,
  ProfitReportRow,
  PurchaseOrderReportRow,
  ReconciliationMovement,
  ReconciliationSummary,
  ReportContext,
  ReportFilters,
  ReportOption,
  ReportPeriodOption,
  UnmatchedDeposit,
} from "./types";

type QueryValue = string | number;
interface OptionRow extends RowDataPacket { id: number; label: string }
interface PeriodRow extends OptionRow { company_id: number; month: number; year: number }
interface AggregateRow extends RowDataPacket {
  total_expected?: string;
  total_received?: string;
  total_reconciled?: string;
  unmatched_amount?: string;
  unmatched_count?: number;
  total_stored?: string;
  total_delivered?: string;
  order_count?: number;
  order_total?: string;
}
interface ReconciliationSummaryRow extends RowDataPacket { expected_count: number; exact_count: number; difference_count: number; pending_count: number }
interface ReconciliationRow extends RowDataPacket {
  expected_amount_id: number; expected_amount: string; reference_data: string | null; reconciliation_id: number | null;
  match_type: "exact" | "similar" | "manual" | null; difference: string | null; deposit_id: number | null;
  deposit_amount: string | null; deposit_date: string | null; bank_account: string | null;
}
interface DepositRow extends RowDataPacket { id: number; amount: string; deposit_date: string; reference: string | null; bank_account: string }
interface DeliveryRow extends RowDataPacket { id: number; delivery_date: string; stored_amount: string; amount: string; received_by: string; delivered_by: string; status: DeliveryReportRow["status"]; signature_reference: string | null }
interface OrderRow extends RowDataPacket { id: number; order_number: string; order_date: string; supplier_legal_name: string; status: PurchaseOrderReportRow["status"]; total: string; drive_url: string | null }
interface ProductSalesDbRow extends RowDataPacket { product_id: number | null; product_reference: string | null; product_name: string; unit: string; quantity: string; order_count: number; sold_total: string }
interface ProductOrderDbRow extends RowDataPacket { order_id: number; order_number: string; order_date: string; quantity: string; sold_total: string }
interface ProfitDbRow extends RowDataPacket { report_key: string; label: string; secondary_label: string | null; quantity: string; net_sales: string; estimated_cost: string | null; missing_cost_items: number }

function positiveId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validDate(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function orderStatus(value: unknown): OrderReportStatus {
  return value === "draft" || value === "confirmed" || value === "cancelled" ? value : "all";
}

function deliveryStatus(value: unknown): DeliveryReportStatus {
  return value === "pending_signature" || value === "confirmed" || value === "cancelled" ? value : "all";
}

export async function resolveReportContext(query: Record<string, string | string[] | undefined>, activeCompanyId: number | null): Promise<ReportContext> {
  const pool = getMysqlPool();
  const [companyRows] = await pool.execute<OptionRow[]>("SELECT id, name AS label FROM companies ORDER BY name");
  const companies = companyRows.map(({ id, label }) => ({ id, label }));
  const companyId = companies.some((item) => item.id === activeCompanyId) ? activeCompanyId : null;
  if (!companyId) return { filters: null, companies, periods: [], products: [], bankAccounts: [] };

  const [periodRows] = await pool.execute<PeriodRow[]>(
    `SELECT id, company_id, month, year, CONCAT(LPAD(month, 2, '0'), '/', year) AS label
     FROM accounting_periods WHERE company_id = ? AND archived_at IS NULL ORDER BY year DESC, month DESC`,
    [companyId],
  );
  const periods: ReportPeriodOption[] = periodRows.map((row) => ({ id: row.id, companyId: row.company_id, month: row.month, year: row.year, label: row.label }));
  const requestedPeriod = positiveId(query.periodId);
  const period = periods.find((item) => item.id === requestedPeriod) ?? periods[0] ?? null;
  if (!period) return { filters: null, companies, periods, products: [], bankAccounts: [] };

  const [productRows, accountRows] = await Promise.all([
    pool.execute<OptionRow[]>("SELECT id, CONCAT(COALESCE(CONCAT(sku, ' — '), ''), name) AS label FROM products WHERE company_id = ? ORDER BY name", [companyId]),
    pool.execute<OptionRow[]>(`SELECT ba.id, CONCAT(b.name, ' — ', ba.alias) AS label FROM bank_accounts ba INNER JOIN banks b ON b.id = ba.bank_id WHERE ba.company_id = ? ORDER BY b.name, ba.alias`, [companyId]),
  ]);
  const products: ReportOption[] = productRows[0].map(({ id, label }) => ({ id, label }));
  const bankAccounts: ReportOption[] = accountRows[0].map(({ id, label }) => ({ id, label }));
  const requestedProduct = positiveId(query.productId);
  const requestedAccount = positiveId(query.bankAccountId);
  return {
    companies,
    periods,
    products,
    bankAccounts,
    filters: {
      companyId,
      periodId: period.id,
      periodMonth: period.month,
      periodYear: period.year,
      dateFrom: validDate(query.dateFrom),
      dateTo: validDate(query.dateTo),
      orderStatus: orderStatus(query.orderStatus),
      deliveryStatus: deliveryStatus(query.deliveryStatus),
      productId: products.some((item) => item.id === requestedProduct) ? requestedProduct : null,
      bankAccountId: bankAccounts.some((item) => item.id === requestedAccount) ? requestedAccount : null,
    },
  };
}

function periodDates(filters: ReportFilters): { start: string; end: string } {
  const start = `${filters.periodYear}-${String(filters.periodMonth).padStart(2, "0")}-01`;
  const next = new Date(Date.UTC(filters.periodYear, filters.periodMonth, 1));
  const end = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`;
  return { start, end };
}

function dateConditions(alias: string, field: string, filters: ReportFilters): { sql: string[]; values: QueryValue[] } {
  const sql: string[] = [];
  const values: QueryValue[] = [];
  if (filters.dateFrom) { sql.push(`${alias}.${field} >= ?`); values.push(filters.dateFrom); }
  if (filters.dateTo) { sql.push(`${alias}.${field} <= ?`); values.push(filters.dateTo); }
  return { sql, values };
}

function orderConditions(filters: ReportFilters, includeStatus = true): { sql: string[]; values: QueryValue[] } {
  const dates = periodDates(filters);
  const extraDates = dateConditions("po", "order_date", filters);
  const sql = ["po.company_id = ?", "po.order_date >= ?", "po.order_date < ?", ...extraDates.sql];
  const values: QueryValue[] = [filters.companyId, dates.start, dates.end, ...extraDates.values];
  if (includeStatus && filters.orderStatus !== "all") { sql.push("po.status = ?"); values.push(filters.orderStatus); }
  return { sql, values };
}

function depositConditions(filters: ReportFilters): { sql: string[]; values: QueryValue[] } {
  const dates = dateConditions("d", "deposit_date", filters);
  const sql = ["d.company_id = ?", "d.accounting_period_id = ?", ...dates.sql];
  const values: QueryValue[] = [filters.companyId, filters.periodId, ...dates.values];
  if (filters.bankAccountId) { sql.push("d.bank_account_id = ?"); values.push(filters.bankAccountId); }
  return { sql, values };
}

function deliveryConditions(filters: ReportFilters): { sql: string[]; values: QueryValue[] } {
  const dates = dateConditions("cd", "delivery_date", filters);
  const sql = ["cd.company_id = ?", "cd.accounting_period_id = ?", ...dates.sql];
  const values: QueryValue[] = [filters.companyId, filters.periodId, ...dates.values];
  if (filters.deliveryStatus !== "all") { sql.push("cd.status = ?"); values.push(filters.deliveryStatus); }
  return { sql, values };
}

export async function getDashboardReport(filters: ReportFilters): Promise<DashboardReport> {
  const pool = getMysqlPool();
  const deposits = depositConditions(filters);
  const deliveries = deliveryConditions(filters);
  const orders = orderConditions(filters);
  const confirmedOrders = orderConditions(filters, false);
  confirmedOrders.sql.push("po.status = 'confirmed'");

  const [expectedResult, receivedResult, reconciledResult, unmatchedResult, deliveredResult, orderAggregateResult, reconciliationSummaryResult, reconciliationRowsResult, unmatchedRowsResult, deliveryRowsResult, orderRowsResult, productRowsResult, selectedProductRowsResult] = await Promise.all([
    pool.execute<AggregateRow[]>("SELECT COALESCE(SUM(amount), 0) AS total_expected FROM expected_amounts WHERE accounting_period_id = ?", [filters.periodId]),
    pool.execute<AggregateRow[]>(`SELECT COALESCE(SUM(d.amount), 0) AS total_received FROM bank_deposits d WHERE ${deposits.sql.join(" AND ")}`, deposits.values),
    pool.execute<AggregateRow[]>(`SELECT COALESCE(SUM(r.expected_amount), 0) AS total_reconciled FROM reconciliations r INNER JOIN expected_amounts e ON e.id = r.expected_amount_id WHERE e.accounting_period_id = ?`, [filters.periodId]),
    pool.execute<AggregateRow[]>(`SELECT COALESCE(SUM(d.amount), 0) AS unmatched_amount, COUNT(*) AS unmatched_count FROM bank_deposits d LEFT JOIN reconciliations r ON r.bank_deposit_id = d.id WHERE ${deposits.sql.join(" AND ")} AND r.id IS NULL`, deposits.values),
    pool.execute<AggregateRow[]>(`SELECT COALESCE(SUM(CASE WHEN cd.status <> 'cancelled' THEN cd.stored_amount ELSE 0 END), 0) AS total_stored, COALESCE(SUM(CASE WHEN cd.status <> 'cancelled' THEN cd.amount ELSE 0 END), 0) AS total_delivered FROM cash_deliveries cd WHERE ${deliveries.sql.join(" AND ")}`, deliveries.values),
    pool.execute<AggregateRow[]>(`SELECT COUNT(*) AS order_count, COALESCE(SUM(po.total), 0) AS order_total FROM purchase_orders po WHERE ${confirmedOrders.sql.join(" AND ")}`, confirmedOrders.values),
    pool.execute<ReconciliationSummaryRow[]>(`SELECT COUNT(*) AS expected_count, SUM(CASE WHEN r.id IS NOT NULL AND r.difference = 0 THEN 1 ELSE 0 END) AS exact_count, SUM(CASE WHEN r.id IS NOT NULL AND r.difference <> 0 THEN 1 ELSE 0 END) AS difference_count, SUM(CASE WHEN r.id IS NULL THEN 1 ELSE 0 END) AS pending_count FROM expected_amounts e LEFT JOIN reconciliations r ON r.expected_amount_id = e.id WHERE e.accounting_period_id = ?`, [filters.periodId]),
    pool.execute<ReconciliationRow[]>(`SELECT e.id AS expected_amount_id, e.amount AS expected_amount, CAST(e.reference_data AS CHAR) AS reference_data, r.id AS reconciliation_id, r.match_type, r.difference, d.id AS deposit_id, d.amount AS deposit_amount, DATE_FORMAT(d.deposit_date, '%Y-%m-%d') AS deposit_date, CASE WHEN d.id IS NULL THEN NULL ELSE CONCAT(b.name, ' — ', ba.alias) END AS bank_account FROM expected_amounts e LEFT JOIN reconciliations r ON r.expected_amount_id = e.id LEFT JOIN bank_deposits d ON d.id = r.bank_deposit_id LEFT JOIN bank_accounts ba ON ba.id = d.bank_account_id LEFT JOIN banks b ON b.id = ba.bank_id WHERE e.accounting_period_id = ? ORDER BY e.id`, [filters.periodId]),
    pool.execute<DepositRow[]>(`SELECT d.id, d.amount, DATE_FORMAT(d.deposit_date, '%Y-%m-%d') AS deposit_date, d.reference, CONCAT(b.name, ' — ', ba.alias) AS bank_account FROM bank_deposits d INNER JOIN bank_accounts ba ON ba.id = d.bank_account_id INNER JOIN banks b ON b.id = ba.bank_id LEFT JOIN reconciliations r ON r.bank_deposit_id = d.id WHERE ${deposits.sql.join(" AND ")} AND r.id IS NULL ORDER BY d.deposit_date DESC, d.id DESC`, deposits.values),
    pool.execute<DeliveryRow[]>(`SELECT cd.id, DATE_FORMAT(cd.delivery_date, '%Y-%m-%d') AS delivery_date, cd.stored_amount, cd.amount, cd.received_by, cd.delivered_by, cd.status, cd.signature_reference FROM cash_deliveries cd WHERE ${deliveries.sql.join(" AND ")} ORDER BY cd.delivery_date DESC, cd.id DESC`, deliveries.values),
    pool.execute<OrderRow[]>(`SELECT po.id, po.order_number, DATE_FORMAT(po.order_date, '%Y-%m-%d') AS order_date, po.supplier_legal_name, po.status, po.total, po.drive_url FROM purchase_orders po WHERE ${orders.sql.join(" AND ")} ORDER BY po.order_date DESC, po.id DESC`, orders.values),
    getProductSalesRows(filters),
    filters.productId ? getSelectedProductOrders(filters) : Promise.resolve([] as ProductOrderRow[]),
  ]);

  const expected = expectedResult[0][0]?.total_expected ?? "0.00";
  const received = receivedResult[0][0]?.total_received ?? "0.00";
  const reconciled = reconciledResult[0][0]?.total_reconciled ?? "0.00";
  const unmatched = unmatchedResult[0][0];
  const stored = deliveredResult[0][0]?.total_stored ?? "0.00";
  const delivered = deliveredResult[0][0]?.total_delivered ?? "0.00";
  const orderAggregate = orderAggregateResult[0][0];
  const metrics: DashboardMetrics = {
    totalExpected: expected,
    totalReceived: received,
    totalReconciled: reconciled,
    pendingToReceive: subtractNonNegative(expected, received),
    unmatchedDepositAmount: unmatched?.unmatched_amount ?? "0.00",
    unmatchedDepositCount: Number(unmatched?.unmatched_count ?? 0),
    totalStored: stored,
    totalDelivered: delivered,
    pendingToDeliver: subtractNonNegative(stored, delivered),
    purchaseOrderCount: Number(orderAggregate?.order_count ?? 0),
    purchaseOrderTotal: orderAggregate?.order_total ?? "0.00",
  };
  const summaryRow = reconciliationSummaryResult[0][0];
  const reconciliationSummary: ReconciliationSummary = {
    expectedCount: Number(summaryRow?.expected_count ?? 0),
    exactCount: Number(summaryRow?.exact_count ?? 0),
    differenceCount: Number(summaryRow?.difference_count ?? 0),
    pendingCount: Number(summaryRow?.pending_count ?? 0),
    unmatchedDepositCount: Number(unmatched?.unmatched_count ?? 0),
  };
  return {
    metrics,
    reconciliation: {
      summary: reconciliationSummary,
      movements: reconciliationRowsResult[0].map(toReconciliation),
      unmatchedDeposits: unmatchedRowsResult[0].map(toUnmatchedDeposit),
    },
    deliveries: deliveryRowsResult[0].map((row) => ({ id: row.id, deliveryDate: row.delivery_date, storedAmount: row.stored_amount, amount: row.amount, receivedBy: row.received_by, deliveredBy: row.delivered_by, status: row.status, signatureReference: row.signature_reference })),
    purchaseOrders: orderRowsResult[0].map((row) => ({ id: row.id, orderNumber: row.order_number, orderDate: row.order_date, supplierLegalName: row.supplier_legal_name, status: row.status, total: row.total, driveUrl: row.drive_url })),
    productSales: productRowsResult,
    selectedProductOrders: selectedProductRowsResult,
  };
}

async function getProductSalesRows(filters: ReportFilters): Promise<ProductSalesRow[]> {
  const condition = orderConditions(filters, false);
  condition.sql.push("po.status = 'confirmed'");
  if (filters.productId) { condition.sql.push("poi.product_id = ?"); condition.values.push(filters.productId); }
  const [rows] = await getMysqlPool().execute<ProductSalesDbRow[]>(`SELECT poi.product_id, poi.product_reference, poi.product_name, poi.unit, SUM(poi.quantity) AS quantity, COUNT(DISTINCT po.id) AS order_count, SUM(poi.total) AS sold_total FROM purchase_order_items poi INNER JOIN purchase_orders po ON po.id = poi.purchase_order_id WHERE ${condition.sql.join(" AND ")} GROUP BY poi.product_id, poi.product_reference, poi.product_name, poi.unit ORDER BY sold_total DESC, poi.product_name`, condition.values);
  return rows.map((row) => ({ productId: row.product_id, productReference: row.product_reference, productName: row.product_name, unit: row.unit, quantity: row.quantity, orderCount: Number(row.order_count), soldTotal: row.sold_total }));
}

async function getSelectedProductOrders(filters: ReportFilters): Promise<ProductOrderRow[]> {
  const condition = orderConditions(filters, false);
  condition.sql.push("po.status = 'confirmed'", "poi.product_id = ?");
  condition.values.push(filters.productId!);
  const [rows] = await getMysqlPool().execute<ProductOrderDbRow[]>(`SELECT po.id AS order_id, po.order_number, DATE_FORMAT(po.order_date, '%Y-%m-%d') AS order_date, SUM(poi.quantity) AS quantity, SUM(poi.total) AS sold_total FROM purchase_order_items poi INNER JOIN purchase_orders po ON po.id = poi.purchase_order_id WHERE ${condition.sql.join(" AND ")} GROUP BY po.id, po.order_number, po.order_date ORDER BY po.order_date DESC, po.id DESC`, condition.values);
  return rows.map((row) => ({ orderId: row.order_id, orderNumber: row.order_number, orderDate: row.order_date, quantity: row.quantity, soldTotal: row.sold_total }));
}

export async function getProfitReport(filters: ReportFilters): Promise<ProfitReport> {
  const base = orderConditions(filters, false);
  base.sql.push("po.status = 'confirmed'");
  if (filters.productId) { base.sql.push("poi.product_id = ?"); base.values.push(filters.productId); }
  const costExpression = "CASE WHEN p.purchase_cost IS NOT NULL THEN ROUND(poi.quantity * p.purchase_cost, 2) WHEN p.default_margin_percentage IS NOT NULL THEN ROUND((poi.subtotal - poi.discount) * (1 - p.default_margin_percentage / 100), 2) ELSE NULL END";
  const missingExpression = "SUM(CASE WHEN p.purchase_cost IS NULL AND p.default_margin_percentage IS NULL THEN 1 ELSE 0 END)";
  const common = `FROM purchase_order_items poi INNER JOIN purchase_orders po ON po.id = poi.purchase_order_id LEFT JOIN products p ON p.id = poi.product_id WHERE ${base.sql.join(" AND ")}`;
  const [productResult, orderResult] = await Promise.all([
    getMysqlPool().execute<ProfitDbRow[]>(`SELECT CONCAT('product-', COALESCE(poi.product_id, poi.product_name)) AS report_key, poi.product_name AS label, poi.product_reference AS secondary_label, SUM(poi.quantity) AS quantity, SUM(poi.subtotal - poi.discount) AS net_sales, SUM(${costExpression}) AS estimated_cost, ${missingExpression} AS missing_cost_items ${common} GROUP BY poi.product_id, poi.product_name, poi.product_reference ORDER BY net_sales DESC`, base.values),
    getMysqlPool().execute<ProfitDbRow[]>(`SELECT CONCAT('order-', po.id) AS report_key, po.order_number AS label, po.supplier_legal_name AS secondary_label, SUM(poi.quantity) AS quantity, SUM(poi.subtotal - poi.discount) AS net_sales, SUM(${costExpression}) AS estimated_cost, ${missingExpression} AS missing_cost_items ${common} GROUP BY po.id, po.order_number, po.supplier_legal_name ORDER BY po.order_date DESC, po.id DESC`, base.values),
  ]);
  const byProduct = productResult[0].map(toProfitRow);
  const byOrder = orderResult[0].map(toProfitRow);
  return { summary: profitSummary(byProduct), byProduct, byOrder };
}

function toProfitRow(row: ProfitDbRow): ProfitReportRow {
  const missing = Number(row.missing_cost_items);
  const net = Number(row.net_sales);
  const cost = missing > 0 || row.estimated_cost === null ? null : Number(row.estimated_cost);
  const profit = cost === null ? null : net - cost;
  return {
    key: row.report_key,
    label: row.label,
    secondaryLabel: row.secondary_label,
    quantity: row.quantity,
    netSales: money(net),
    estimatedCost: cost === null ? null : money(cost),
    profit: profit === null ? null : money(profit),
    marginPercentage: profit === null || net === 0 ? null : money((profit / net) * 100),
    missingCostItems: missing,
  };
}

function profitSummary(rows: ProfitReportRow[]): ProfitReportRow {
  const net = rows.reduce((sum, row) => sum + Number(row.netSales), 0);
  const quantity = rows.reduce((sum, row) => sum + Number(row.quantity), 0);
  const missing = rows.reduce((sum, row) => sum + row.missingCostItems, 0);
  const cost = missing > 0 ? null : rows.reduce((sum, row) => sum + Number(row.estimatedCost ?? 0), 0);
  const profit = cost === null ? null : net - cost;
  return { key: "summary", label: "Total", secondaryLabel: null, quantity: String(quantity), netSales: money(net), estimatedCost: cost === null ? null : money(cost), profit: profit === null ? null : money(profit), marginPercentage: profit === null || net === 0 ? null : money((profit / net) * 100), missingCostItems: missing };
}

function toReconciliation(row: ReconciliationRow): ReconciliationMovement {
  return { expectedAmountId: row.expected_amount_id, expectedAmount: row.expected_amount, referenceData: row.reference_data, reconciliationId: row.reconciliation_id, matchType: row.match_type, difference: row.difference, depositId: row.deposit_id, depositAmount: row.deposit_amount, depositDate: row.deposit_date, bankAccount: row.bank_account };
}

function toUnmatchedDeposit(row: DepositRow): UnmatchedDeposit {
  return { id: row.id, amount: row.amount, depositDate: row.deposit_date, reference: row.reference, bankAccount: row.bank_account };
}

function subtractNonNegative(left: string, right: string): string {
  return money(Math.max(0, Number(left) - Number(right)));
}

function money(value: number): string {
  return value.toFixed(2);
}
