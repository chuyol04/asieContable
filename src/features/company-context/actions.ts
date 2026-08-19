"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCompany } from "@/features/companies/service";
import { safeInternalPath } from "@/features/auth/security";
import { ACTIVE_COMPANY_COOKIE } from "./service";

export async function setActiveCompanyAction(formData: FormData): Promise<void> {
  const companyId = Number(formData.get("companyId"));
  const company = Number.isSafeInteger(companyId) && companyId > 0 ? await getCompany(companyId) : null;
  const returnTo = safeInternalPath(formData.get("returnTo"));
  if (!company || !company.isActive) redirect(returnTo);
  (await cookies()).set(ACTIVE_COMPANY_COOKIE, String(company.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  redirect(returnTo);
}
