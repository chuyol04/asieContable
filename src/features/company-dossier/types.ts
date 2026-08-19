export type DossierSection = "representantes" | "documentos" | "cuentas";
export type DossierTab = "general" | DossierSection | "periodos" | "productos" | "ordenes" | "caratulas";

export type DocumentType =
  | "acta_constitutiva"
  | "constancia_fiscal"
  | "comprobante_domicilio"
  | "identificacion_oficial"
  | "poder_notarial"
  | "constancia_bancaria"
  | "opinion_cumplimiento"
  | "poderes"
  | "identificaciones"
  | "comprobantes"
  | "otros";

export interface CompanyRepresentative {
  id: number;
  companyId: number;
  fullName: string;
  position: string;
  taxId: string | null;
  curp: string | null;
  email: string | null;
  phone: string | null;
  observations: string | null;
  isActive: boolean;
}

export interface CompanyDocument {
  id: number;
  companyId: number;
  representativeId: number | null;
  representativeName: string | null;
  documentType: DocumentType;
  documentName: string;
  documentDate: string | null;
  expirationDate: string | null;
  externalUrl: string | null;
  fileId: string | null;
  fileName: string | null;
  fileUrl: string | null;
  storageProvider: string | null;
  uploadedAt: Date | null;
  createdAt: Date;
  observations: string | null;
  isActive: boolean;
}

export interface BankAccount {
  id: number;
  companyId: number;
  bankId: number;
  bankName: string;
  alias: string;
  accountNumber: string;
  clabe: string;
  branch: string;
  plaza: string | null;
  currency: string;
  holder: string;
  observations: string | null;
  isActive: boolean;
}

export interface CompanyDossier {
  representatives: CompanyRepresentative[];
  documents: CompanyDocument[];
  bankAccounts: BankAccount[];
}

export interface CompanyCoverTemplate {
  id: number;
  companyId: number;
  fileId: string;
  fileName: string;
  fileUrl: string;
  storageProvider: string;
  uploadedAt: Date;
}

export type DossierInput =
  | {
      kind: "representantes";
      fullName: string;
      position: string;
      taxId: string | null;
      curp: string | null;
      email: string | null;
      phone: string | null;
      observations: string | null;
    }
  | {
      kind: "documentos";
      documentType: DocumentType;
      documentName: string;
      representativeId: number | null;
      documentDate: string | null;
      expirationDate: string | null;
      externalUrl: string | null;
      observations: string | null;
    }
  | {
      kind: "cuentas";
      bankId: number;
      alias: string;
      accountNumber: string;
      clabe: string;
      branch: string;
      plaza: string | null;
      currency: string;
      holder: string;
      observations: string | null;
    };

export type DossierFormValues = Record<string, string>;

export interface DossierFormState {
  message: string;
  values?: DossierFormValues;
}

export type DossierFormAction = (
  state: DossierFormState,
  formData: FormData,
) => Promise<DossierFormState>;

export interface DocumentFileMetadata {
  fileId: string;
  fileName: string;
  fileUrl: string;
  storageProvider: "google_drive";
  uploadedAt: Date;
}
