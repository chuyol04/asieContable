export type OrderReportStatus = "all" | "draft" | "confirmed" | "cancelled";
export type DeliveryReportStatus = "all" | "pending_signature" | "confirmed" | "cancelled";

export interface ReportFilters {
  companyId: number;
  periodId: number;
  periodMonth: number;
  periodYear: number;
  dateFrom: string | null;
  dateTo: string | null;
  orderStatus: OrderReportStatus;
  deliveryStatus: DeliveryReportStatus;
  productId: number | null;
  bankAccountId: number | null;
}

export interface ReportOption { id: number; label: string }
export interface ReportPeriodOption extends ReportOption { companyId: number; month: number; year: number }

export interface ReportContext {
  filters: ReportFilters | null;
  companies: ReportOption[];
  periods: ReportPeriodOption[];
  products: ReportOption[];
  bankAccounts: ReportOption[];
}

export interface DashboardMetrics {
  totalExpected: string;
  totalReceived: string;
  totalReconciled: string;
  pendingToReceive: string;
  unmatchedDepositAmount: string;
  unmatchedDepositCount: number;
  totalStored: string;
  totalDelivered: string;
  pendingToDeliver: string;
  purchaseOrderCount: number;
  purchaseOrderTotal: string;
}

export interface ReconciliationSummary {
  expectedCount: number;
  exactCount: number;
  differenceCount: number;
  pendingCount: number;
  unmatchedDepositCount: number;
}

export interface ReconciliationMovement {
  expectedAmountId: number;
  expectedAmount: string;
  referenceData: string | null;
  reconciliationId: number | null;
  matchType: "exact" | "similar" | "manual" | null;
  difference: string | null;
  depositId: number | null;
  depositAmount: string | null;
  depositDate: string | null;
  bankAccount: string | null;
}

export interface UnmatchedDeposit {
  id: number;
  amount: string;
  depositDate: string;
  reference: string | null;
  bankAccount: string;
}

export interface DeliveryReportRow {
  id: number;
  deliveryDate: string;
  storedAmount: string;
  amount: string;
  receivedBy: string;
  deliveredBy: string;
  status: "pending_signature" | "confirmed" | "cancelled";
  signatureReference: string | null;
}

export interface PurchaseOrderReportRow {
  id: number;
  orderNumber: string;
  orderDate: string;
  supplierLegalName: string;
  status: "draft" | "confirmed" | "cancelled";
  total: string;
  driveUrl: string | null;
}

export interface ProductSalesRow {
  productId: number | null;
  productReference: string | null;
  productName: string;
  unit: string;
  quantity: string;
  orderCount: number;
  soldTotal: string;
}

export interface ProductOrderRow {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  quantity: string;
  soldTotal: string;
}

export interface DashboardReport {
  metrics: DashboardMetrics;
  reconciliation: { summary: ReconciliationSummary; movements: ReconciliationMovement[]; unmatchedDeposits: UnmatchedDeposit[] };
  deliveries: DeliveryReportRow[];
  purchaseOrders: PurchaseOrderReportRow[];
  productSales: ProductSalesRow[];
  selectedProductOrders: ProductOrderRow[];
}

export interface ProfitReportRow {
  key: string;
  label: string;
  secondaryLabel: string | null;
  quantity: string;
  netSales: string;
  estimatedCost: string | null;
  profit: string | null;
  marginPercentage: string | null;
  missingCostItems: number;
}

export interface ProfitReport {
  summary: ProfitReportRow;
  byProduct: ProfitReportRow[];
  byOrder: ProfitReportRow[];
}
