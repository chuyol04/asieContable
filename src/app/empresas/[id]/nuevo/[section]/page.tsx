import { notFound } from "next/navigation";

import { listBanks } from "@/features/banks/service";
import { getCompany } from "@/features/companies/service";
import { parseCompanyId } from "@/features/companies/validation";
import { saveDossierAction } from "@/features/company-dossier/actions";
import { DossierForm } from "@/features/company-dossier/components/dossier-form";
import { parseDossierSection } from "@/features/company-dossier/validation";
import { getCompanyDossier } from "@/features/company-dossier/service";
import { validateActiveCompany } from "@/features/company-context/service";

const titles = { representantes: "representante legal", documentos: "documento", cuentas: "cuenta bancaria" };

export default async function NewDossierRecordPage({ params }: PageProps<"/empresas/[id]/nuevo/[section]">) {
  const route = await params;
  const companyId = parseCompanyId(route.id);
  const section = parseDossierSection(route.section);
  if (!companyId || !section) notFound();
  await validateActiveCompany(companyId);

  const [company, banks, dossier] = await Promise.all([
    getCompany(companyId),
    section === "cuentas" ? listBanks("", "all") : Promise.resolve([]),
    section === "documentos" ? getCompanyDossier(companyId) : Promise.resolve(null),
  ]);
  if (!company) notFound();

  return <div className="mx-auto max-w-3xl">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">{company.name} / Expediente</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Nuevo {titles[section]}</h1>
    <p className="mb-6 mt-2 text-sm text-slate-500">Registra la información dentro del expediente de la empresa.</p>
    <DossierForm action={saveDossierAction.bind(null, companyId, section, null)} banks={banks} cancelHref={`/empresas/${companyId}?tab=${section}`} representatives={dossier?.representatives ?? []} section={section} submitLabel="Guardar" />
  </div>;
}
