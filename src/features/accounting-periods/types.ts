export type PeriodStatus = "open" | "review" | "closed";
export type PeriodStatusFilter = PeriodStatus | "all";

export interface AccountingPeriod {
  id: number;
  companyId: number;
  companyName: string;
  month: number;
  year: number;
  status: PeriodStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PeriodFilters {
  search: string;
  companyId: number | null;
  year: number | null;
  status: PeriodStatusFilter;
}

export interface PeriodInput {
  companyId: number;
  month: number;
  year: number;
  notes: string | null;
}

export interface PeriodFormValues {
  companyId: string;
  month: string;
  year: string;
  notes: string;
}

export interface PeriodFormState {
  message: string;
  values?: PeriodFormValues;
}

export type PeriodFormAction = (
  state: PeriodFormState,
  formData: FormData,
) => Promise<PeriodFormState>;
