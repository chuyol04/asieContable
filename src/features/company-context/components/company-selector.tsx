"use client";

import { usePathname, useSearchParams } from "next/navigation";

import type { Company } from "@/features/companies/types";
import { setActiveCompanyAction } from "../actions";

export function CompanySelector({ activeCompanyId, companies }: { activeCompanyId: number | null; companies: Company[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${searchParams.size ? `?${searchParams}` : ""}`;
  return <form action={setActiveCompanyAction} className="min-w-0"><input name="returnTo" type="hidden" value={returnTo} /><label className="sr-only" htmlFor="active-company">Empresa activa</label><select aria-label="Empresa activa" className="max-w-44 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-cyan-500 sm:max-w-60 sm:text-sm" disabled={!companies.length} id="active-company" name="companyId" onChange={(event) => event.currentTarget.form?.requestSubmit()} required value={activeCompanyId ?? ""}><option disabled value="">Selecciona empresa</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></form>;
}
