export type SupplierStatusFilter = "active" | "inactive" | "all";

export interface Supplier {
  id: number;
  companyId: number;
  legalName: string;
  taxId: string | null;
  fiscalAddress: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierInput {
  legalName: string;
  taxId: string | null;
  fiscalAddress: string | null;
  phone: string | null;
}

export interface SupplierFormValues {
  legalName: string;
  taxId: string;
  fiscalAddress: string;
  phone: string;
}

export interface SupplierFormState { message: string; values?: SupplierFormValues }
export type SupplierFormAction = (state: SupplierFormState, formData: FormData) => Promise<SupplierFormState>;
