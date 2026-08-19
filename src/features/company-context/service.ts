import { cache } from "react";
import { cookies } from "next/headers";

import { listCompanies } from "@/features/companies/service";

export const ACTIVE_COMPANY_COOKIE = "asie_active_company";

export const getCompanyContext = cache(async () => {
  const companies = await listCompanies("", "active");
  const cookieId = Number((await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value);
  const selected = Number.isSafeInteger(cookieId) && cookieId > 0 ? companies.find((company) => company.id === cookieId) ?? null : null;
  const activeCompany = selected ?? (companies.length === 1 ? companies[0] : null);
  return { companies, activeCompany };
});

export async function getActiveCompanyId(): Promise<number | null> {
  return (await getCompanyContext()).activeCompany?.id ?? null;
}

export async function requireActiveCompanyId(): Promise<number> {
  const companyId = await getActiveCompanyId();
  if (!companyId) throw new Error("ACTIVE_COMPANY_REQUIRED");
  return companyId;
}

export async function validateActiveCompany(companyId: number): Promise<void> {
  if (companyId !== await requireActiveCompanyId()) throw new Error("INVALID_COMPANY_CONTEXT");
}
