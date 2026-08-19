export type DepositStatus = "available" | "reconciled";

export interface BankDeposit {
  id: number;
  batchId: number | null;
  companyId: number;
  companyName: string;
  accountingPeriodId: number;
  periodMonth: number;
  periodYear: number;
  bankAccountId: number;
  bankName: string;
  accountAlias: string;
  amount: string;
  depositDate: string;
  reference: string | null;
  notes: string | null;
  status: DepositStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankAccountOption {
  id: number;
  companyId: number;
  bankName: string;
  alias: string;
  accountNumber: string;
  isActive: boolean;
}

export interface DepositFilters {
  companyId: number | null;
  accountingPeriodId: number | null;
  bankAccountId: number | null;
  depositDate: string | null;
  status: DepositStatus | null;
  batchId: number | null;
}

export interface DepositBatchOption {
  id: number;
  companyId: number;
  companyName: string;
  accountingPeriodId: number;
  periodMonth: number;
  periodYear: number;
  bankAccountId: number;
  bankName: string;
  accountAlias: string;
  depositDate: string;
}

export interface DepositInput {
  companyId: number;
  accountingPeriodId: number;
  bankAccountId: number;
  depositDate: string;
  reference: string | null;
  notes: string | null;
}

export interface DepositFormValues {
  companyId: string;
  accountingPeriodId: string;
  bankAccountId: string;
  amount: string;
  amounts: string;
  depositDate: string;
  reference: string;
  notes: string;
}

export interface DepositFormState {
  message: string;
  values?: DepositFormValues;
}

export type DepositFormAction = (
  state: DepositFormState,
  formData: FormData,
) => Promise<DepositFormState>;
