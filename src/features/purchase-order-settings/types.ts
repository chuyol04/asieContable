export interface PurchaseOrderSettings {
  id: number;
  companyId: number;
  logoUrl: string | null;
  orderPrefix: string | null;
  nextOrderNumber: number;
  defaultTaxRate: string;
  headerText: string | null;
  footerText: string | null;
  leftSignatureText: string;
  rightSignatureText: string;
  defaultNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderIdentityInput {
  name: string;
  legalName: string | null;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  fiscalAddress: string | null;
}

export interface PurchaseOrderSettingsInput {
  logoUrl: string | null;
  orderPrefix: string | null;
  nextOrderNumber: number;
  defaultTaxRate: string;
  headerText: string | null;
  footerText: string | null;
  leftSignatureText: string;
  rightSignatureText: string;
  defaultNotes: string | null;
}

export interface PurchaseOrderSettingsFormValues {
  companyName: string;
  legalName: string;
  taxId: string;
  phone: string;
  email: string;
  fiscalAddress: string;
  orderPrefix: string;
  nextOrderNumber: string;
  defaultTaxRate: string;
  headerText: string;
  footerText: string;
  leftSignatureText: string;
  rightSignatureText: string;
  defaultNotes: string;
}

export interface PurchaseOrderSettingsFormState {
  message: string;
  values?: PurchaseOrderSettingsFormValues;
}

export type PurchaseOrderSettingsFormAction = (
  state: PurchaseOrderSettingsFormState,
  formData: FormData,
) => Promise<PurchaseOrderSettingsFormState>;
