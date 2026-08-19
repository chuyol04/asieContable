export type BankStatusFilter = "active" | "inactive" | "all";

export interface Bank {
  id: number;
  name: string;
  shortName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankInput {
  name: string;
  shortName: string | null;
}

export interface BankFormValues {
  name: string;
  shortName: string;
}

export interface BankFormState {
  message: string;
  values?: BankFormValues;
}

export type BankFormAction = (
  state: BankFormState,
  formData: FormData,
) => Promise<BankFormState>;
