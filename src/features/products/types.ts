export type ProductStatusFilter = "active" | "inactive" | "all";

export interface Product {
  id: number;
  companyId: number;
  sku: string | null;
  name: string;
  description: string;
  unit: string;
  unitPrice: string;
  purchaseCost: string | null;
  defaultMarginPercentage: string | null;
  taxRate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductInput {
  sku: string | null;
  name: string;
  description: string;
  unit: string;
  unitPrice: string;
  purchaseCost: string | null;
  defaultMarginPercentage: string | null;
  taxRate: string | null;
  notes: string | null;
}

export interface ProductFormValues {
  sku: string;
  name: string;
  description: string;
  unit: string;
  unitPrice: string;
  purchaseCost: string;
  defaultMarginPercentage: string;
  taxRate: string;
  notes: string;
}

export interface ProductFormState {
  message: string;
  values?: ProductFormValues;
}

export type ProductFormAction = (
  state: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;
