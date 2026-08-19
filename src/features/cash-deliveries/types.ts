export type CashDeliveryStatus = "pending_signature" | "confirmed" | "cancelled";

export interface CashDelivery {
  id: number;
  companyId: number;
  companyName: string;
  accountingPeriodId: number;
  periodMonth: number;
  periodYear: number;
  deliveryDate: string;
  storedAmount: string;
  amount: string;
  deliveredBy: string;
  receivedBy: string;
  notes: string | null;
  status: CashDeliveryStatus;
  signatureReference: string | null;
  signedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliverySummary {
  totalStored: string;
  totalDelivered: string;
  pendingBalance: string;
  deliveryCount: number;
}

export interface DeliveryInput {
  companyId: number;
  accountingPeriodId: number;
  deliveryDate: string;
  storedAmount: string;
  amount: string;
  deliveredBy: string;
  receivedBy: string;
  notes: string | null;
}

export interface DeliveryFormValues {
  companyId: string;
  accountingPeriodId: string;
  deliveryDate: string;
  storedAmount: string;
  amount: string;
  deliveredBy: string;
  receivedBy: string;
  notes: string;
}

export interface DeliveryFormState {
  message: string;
  values?: DeliveryFormValues;
}

export type DeliveryFormAction = (state: DeliveryFormState, formData: FormData) => Promise<DeliveryFormState>;
