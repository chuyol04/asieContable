import type { BankDeposit } from "@/features/bank-deposits/types";
import type { ExpectedAmount } from "@/features/expected-amounts/types";

export type MatchType = "exact" | "similar" | "manual";

export interface ReconciliationRecord {
  id: number;
  expectedAmountId: number;
  bankDepositId: number;
  matchType: MatchType;
  expectedAmount: string;
  depositAmount: string;
  difference: string;
  confirmedAt: Date;
  deposit: BankDeposit;
}

export interface MatchCandidate {
  deposit: BankDeposit;
  difference: string;
  absoluteDifferenceCents: number;
}

export interface ReconciliationRow {
  expected: ExpectedAmount;
  reconciliation: ReconciliationRecord | null;
  exactCandidate: MatchCandidate | null;
  similarCandidates: MatchCandidate[];
}

export interface ReconciliationWorkspace {
  tolerance: string;
  rows: ReconciliationRow[];
  availableDeposits: BankDeposit[];
  exactMatchCount: number;
  similarSuggestionCount: number;
  totalExpectedCents: number;
  totalReceivedCents: number;
  totalReconciledCents: number;
}
