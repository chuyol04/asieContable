export type ClientStatusFilter = "active" | "inactive" | "all";

export interface Client {
  id: number;
  name: string;
  legalName: string | null;
  taxId: string | null;
  userEmail: string;
  firebaseUid: string;
  phone: string | null;
  website: string | null;
  notes: string | null;
  driveFolderId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientInput {
  name: string;
  legalName: string | null;
  taxId: string | null;
  userEmail: string;
  firebaseUid: string;
  phone: string | null;
  website: string | null;
  notes: string | null;
}

export interface ClientFormValues {
  name: string;
  legalName: string;
  taxId: string;
  userEmail: string;
  phone: string;
  website: string;
  notes: string;
}

export interface ClientFormState { message: string; values?: ClientFormValues }
export type ClientFormAction = (state: ClientFormState, formData: FormData) => Promise<ClientFormState>;

export interface ClientPayrollCompany {
  id: number;
  clientId: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollFile {
  id: number;
  clientId: number;
  payrollCompanyId: number;
  payrollCompanyName: string;
  fileName: string;
  fileType: "pdf" | "xls" | "xlsx";
  driveFileId: string;
  driveUrl: string;
  payrollDate: string | null;
  periodMonth: number;
  periodYear: number;
  notes: string | null;
  uploadedAt: Date;
  isActive: boolean;
}

export interface PayrollFormState { message: string }
export type PayrollFormAction = (state: PayrollFormState, formData: FormData) => Promise<PayrollFormState>;
