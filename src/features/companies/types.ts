export type CompanyStatusFilter = "active" | "inactive" | "all";

export interface Company {
  id: number;
  name: string;
  legalName: string | null;
  taxId: string | null;
  fiscalAddress: string | null;
  phone: string | null;
  email: string | null;
  phones: string[];
  emails: string[];
  website: string | null;
  incorporationDate: string | null;
  notary: string | null;
  deedNumber: string | null;
  observations: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyInput {
  name: string;
  legalName: string | null;
  taxId: string | null;
  fiscalAddress: string | null;
  phones: string[];
  emails: string[];
  website: string | null;
  incorporationDate: string | null;
  notary: string | null;
  deedNumber: string | null;
  observations: string | null;
}

export interface CompanyFormValues {
  name: string;
  legalName: string;
  taxId: string;
  fiscalAddress: string;
  phones: string;
  emails: string;
  website: string;
  incorporationDate: string;
  notary: string;
  deedNumber: string;
  observations: string;
}

export interface CompanyFormState {
  message: string;
  values?: CompanyFormValues;
}

export type CompanyFormAction = (
  state: CompanyFormState,
  formData: FormData,
) => Promise<CompanyFormState>;
