export type PurchaseOrderStatus = "draft" | "confirmed" | "cancelled";
export type PurchaseOrderStatusFilter = PurchaseOrderStatus | "all";

export interface PurchaseOrder {
  id: number;
  companyId: number;
  companyName: string;
  orderSequence: number;
  orderNumber: string;
  orderDate: string;
  deliveryDate: string;
  supplierLegalName: string;
  supplierTaxId: string | null;
  supplierAddress: string | null;
  supplierPhone: string | null;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  notes: string | null;
  status: PurchaseOrderStatus;
  driveFileId: string | null;
  driveFileName: string | null;
  driveUrl: string | null;
  driveFolderId: string | null;
  driveUploadedAt: Date | null;
  sentToAccountingAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productId: number | null;
  productReference: string | null;
  productName: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  taxRate: string;
  subtotal: string;
  taxAmount: string;
  total: string;
}

export interface PurchaseOrderDetail extends PurchaseOrder { items: PurchaseOrderItem[] }

export interface PurchaseOrderItemDraft {
  itemId: number | null;
  productId: number;
  unit: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  taxRate: string;
}

export interface PurchaseOrderInput {
  orderDate: string;
  deliveryDate: string;
  supplierLegalName: string;
  supplierTaxId: string | null;
  supplierAddress: string | null;
  supplierPhone: string | null;
  notes: string | null;
  items: PurchaseOrderItemDraft[];
}

export interface PurchaseOrderFormValues {
  orderDate: string;
  deliveryDate: string;
  supplierLegalName: string;
  supplierTaxId: string;
  supplierAddress: string;
  supplierPhone: string;
  notes: string;
  items: string;
}

export interface PurchaseOrderFormState { message: string; values?: PurchaseOrderFormValues }
export type PurchaseOrderFormAction = (state: PurchaseOrderFormState, formData: FormData) => Promise<PurchaseOrderFormState>;

export interface PurchaseOrderFilters {
  search: string;
  companyId: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  status: PurchaseOrderStatusFilter;
}

export interface PurchaseOrderDriveDocument {
  fileId: string;
  fileName: string;
  url: string;
  folderId: string;
}
