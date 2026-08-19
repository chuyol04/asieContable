import { notFound } from "next/navigation";

import { updateCompanyAction } from "@/features/companies/actions";
import { CompanyForm } from "@/features/companies/components/company-form";
import { getCompany } from "@/features/companies/service";
import { parseCompanyId } from "@/features/companies/validation";

export const dynamic = "force-dynamic";

export default async function EditCompanyPage({ params }: PageProps<"/empresas/[id]/editar">) {
  const { id: rawId } = await params;
  const id = parseCompanyId(rawId);

  if (!id) notFound();

  const company = await getCompany(id);
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Empresas / Editar</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Editar {company.name}</h1>
      <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">Actualiza los datos generales de la empresa.</p>
      <CompanyForm
        action={updateCompanyAction.bind(null, company.id)}
        initialValues={{
          name: company.name,
          legalName: company.legalName ?? "",
          taxId: company.taxId ?? "",
          fiscalAddress: company.fiscalAddress ?? "",
          phones: company.phones.join("\n"),
          emails: company.emails.join("\n"),
          website: company.website ?? "",
          incorporationDate: company.incorporationDate ?? "",
          notary: company.notary ?? "",
          deedNumber: company.deedNumber ?? "",
          observations: company.observations ?? "",
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
