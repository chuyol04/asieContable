export interface ExpectedAmount {
  id: number;
  accountingPeriodId: number;
  importId: number;
  sourceRowNumber: number;
  amount: string;
  referenceData: Record<string, string>;
  matchType: "exact" | "similar" | "manual" | null;
  createdAt: Date;
}

export interface ExpectedAmountImport {
  id: number;
  accountingPeriodId: number;
  sourceName: string | null;
  amountColumn: string;
  rowCount: number;
  reconciledCount: number;
  createdAt: Date;
}

export interface ExpectedImportRow {
  sourceRowNumber: number;
  amount: string;
  referenceData: Record<string, string>;
}

export interface ExpectedImportState {
  message: string;
}
