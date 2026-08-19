import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { listAccountingPeriods } from "@/features/accounting-periods/service";
import type { PeriodStatus } from "@/features/accounting-periods/types";
import { monthNames, periodStatusLabels } from "@/features/accounting-periods/validation";
import { setCompanyStatusAction } from "@/features/companies/actions";
import { getCompany } from "@/features/companies/service";
import { parseCompanyId } from "@/features/companies/validation";
import { saveCompanyCoverTemplateAction, setDossierStatusAction } from "@/features/company-dossier/actions";
import { getCompanyCoverTemplate, getCompanyDossier } from "@/features/company-dossier/service";
import type { CompanyDocument, DossierSection } from "@/features/company-dossier/types";
import { documentCategory, documentTypes, parseDossierTab } from "@/features/company-dossier/validation";
import { ProductCatalog } from "@/features/products/components/product-catalog";
import { listProducts } from "@/features/products/service";
import { parseProductStatus } from "@/features/products/validation";
import { getPurchaseOrderSettings } from "@/features/purchase-order-settings/service";
import { formatNextOrderNumber } from "@/features/purchase-order-settings/validation";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  created: "La empresa se creó correctamente.",
  updated: "Los datos de la empresa se actualizaron correctamente.",
  "record-created": "El registro se creó correctamente.",
  "record-updated": "El registro se actualizó correctamente.",
  "status-updated": "El estado se actualizó correctamente.",
  "cover-saved": "La carátula se guardó correctamente.",
};

const errors: Record<string, string> = {
  "cover-invalid": "Selecciona un archivo PDF de hasta 20 MB.",
  "cover-drive-config": "Configura Google Drive antes de cargar la carátula.",
  "cover-file-exists": "Ya existe un archivo con ese nombre en la carpeta de Drive.",
  "cover-drive-upload": "No fue posible cargar la carátula en Google Drive.",
  "cover-save": "No fue posible guardar la carátula. Inténtalo nuevamente.",
};

export default async function CompanyDetailPage({ params, searchParams }: PageProps<"/empresas/[id]">) {
  const { id: rawId } = await params;
  const id = parseCompanyId(rawId);
  if (!id) notFound();

  const query = await searchParams;
  const tab = parseDossierTab(query.tab);
  const productSearch = typeof query.search === "string" ? query.search.trim().slice(0, 191) : "";
  const productStatus = parseProductStatus(query.status);
  const [company, dossier, periods, products, orderSettings, coverTemplate] = await Promise.all([
    getCompany(id),
    getCompanyDossier(id),
    listAccountingPeriods({ search: "", companyId: id, year: null, status: "all" }),
    tab === "productos" ? listProducts(id, productSearch, productStatus) : Promise.resolve([]),
    tab === "ordenes" ? getPurchaseOrderSettings(id) : Promise.resolve(null),
    tab === "caratulas" ? getCompanyCoverTemplate(id) : Promise.resolve(null),
  ]);
  if (!company) notFound();

  const message = typeof query.message === "string" ? messages[query.message] : undefined;
  const error = typeof query.error === "string" ? errors[query.error] : undefined;
  const tabs = [
    { id: "general", label: "General", count: null },
    { id: "representantes", label: "Representantes", count: dossier.representatives.length },
    { id: "documentos", label: "Documentos", count: dossier.documents.length },
    { id: "caratulas", label: "Templates / Carátulas", count: coverTemplate ? 1 : 0 },
    { id: "cuentas", label: "Cuentas bancarias", count: dossier.bankAccounts.length },
    { id: "periodos", label: "Periodos", count: periods.length },
    { id: "productos", label: "Productos", count: tab === "productos" ? products.length : null },
    { id: "ordenes", label: "Configuración de órdenes", count: null },
  ] as const;

  return <div className="mx-auto max-w-6xl">
    {message ? <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
    {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Empresas / Expediente</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{company.name}</h1>
          <StatusBadge active={company.isActive} />
        </div>
        <p className="mt-2 text-sm text-slate-500">Expediente administrativo y bancario de la empresa.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" href="/empresas">Volver</Link>
        <Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700" href={`/empresas/${company.id}/editar`}>Editar general</Link>
      </div>
    </div>

    <nav aria-label="Secciones del expediente" className="mt-6 overflow-x-auto border-b border-slate-200">
      <div className="flex min-w-max gap-1">
        {tabs.map((item) => <Link aria-current={tab === item.id ? "page" : undefined} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === item.id ? "border-cyan-600 text-cyan-700" : "border-transparent text-slate-500 hover:text-slate-800"}`} href={`/empresas/${id}?tab=${item.id}`} key={item.id}>
          {item.label}{item.count === null ? "" : ` (${item.count})`}
        </Link>)}
      </div>
    </nav>

    {tab === "general" ? <GeneralSection company={company} /> : null}

    {tab === "representantes" ? <DossierSectionHeader companyId={id} description="Personas autorizadas para representar legalmente a la empresa." section="representantes" title="Representantes legales" /> : null}
    {tab === "representantes" ? <RecordGrid empty="No hay representantes registrados.">
      {dossier.representatives.map((record) => <RecordCard active={record.isActive} companyId={id} editHref={`/empresas/${id}/editar/representantes/${record.id}`} key={record.id} recordId={record.id} section="representantes" subtitle={record.position} title={record.fullName}>
        <Line label="RFC" value={record.taxId} /><Line label="CURP" value={record.curp} /><Line label="Correo" value={record.email} /><Line label="Teléfono" value={record.phone} /><Line label="Observaciones" value={record.observations} />
      </RecordCard>)}
    </RecordGrid> : null}

    {tab === "documentos" ? <DossierSectionHeader companyId={id} description="Archivos administrativos organizados por categoría; MySQL conserva únicamente sus metadatos." section="documentos" title="Documentos de empresa" /> : null}
    {tab === "documentos" ? <DocumentGroups companyId={id} documents={dossier.documents} /> : null}

    {tab === "caratulas" ? <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="text-lg font-semibold text-slate-900">Template / Carátula de empresa</h2><p className="mt-1 text-sm text-slate-500">Carga un único PDF con la presentación general de la empresa, por ejemplo logo, información fiscal y cuenta bancaria.</p></div><div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1.15fr]">{coverTemplate ? <article className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5"><DocumentBadge label="Disponible" tone="emerald" /><h3 className="mt-4 break-words font-semibold text-slate-900">{coverTemplate.fileName}</h3><p className="mt-2 text-sm text-slate-500">Actualizada {formatDateTime(coverTemplate.uploadedAt)}</p><a className="mt-5 inline-flex rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50" href={coverTemplate.fileUrl} rel="noreferrer" target="_blank">Abrir PDF</a></article> : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center"><DocumentBadge label="Faltante" tone="amber" /><p className="mt-3 text-sm text-slate-500">Esta empresa todavía no tiene una carátula.</p></div>}<form action={saveCompanyCoverTemplateAction} className="rounded-xl border border-slate-200 p-5"><input name="companyId" type="hidden" value={id} /><label className="text-sm font-semibold text-slate-800" htmlFor="coverFile">{coverTemplate ? "Reemplazar carátula" : "Subir carátula"}</label><p className="mt-1 text-xs leading-5 text-slate-500">Solo PDF, máximo 20 MB. Al reemplazar se actualiza el mismo archivo de Drive y se conserva un solo registro por empresa.</p><input accept=".pdf,application/pdf" className="mt-4 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:font-semibold file:text-cyan-700" id="coverFile" name="coverFile" required type="file" /><button className="mt-5 w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 sm:w-auto" type="submit">{coverTemplate ? "Reemplazar PDF" : "Guardar PDF"}</button></form></div></section> : null}

    {tab === "cuentas" ? <DossierSectionHeader companyId={id} description="Cuentas vinculadas directamente a la empresa y al catálogo auxiliar de bancos." section="cuentas" title="Cuentas bancarias" /> : null}
    {tab === "cuentas" ? <RecordGrid empty="No hay cuentas bancarias registradas.">
      {dossier.bankAccounts.map((record) => <RecordCard active={record.isActive} companyId={id} editHref={`/empresas/${id}/editar/cuentas/${record.id}`} key={record.id} recordId={record.id} section="cuentas" subtitle={`${record.bankName} · ${record.currency}`} title={record.alias}>
        <Line label="Cuenta" value={record.accountNumber} /><Line label="CLABE" value={record.clabe} /><Line label="Sucursal" value={`${record.branch}${record.plaza ? ` · ${record.plaza}` : ""}`} /><Line label="Titular" value={record.holder} /><Line label="Observaciones" value={record.observations} />
      </RecordCard>)}
    </RecordGrid> : null}

    {tab === "periodos" ? <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Periodos mensuales</h2><p className="mt-1 text-sm text-slate-500">Periodos contables registrados para esta empresa.</p></div><Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700" href={`/periodos/nuevo?companyId=${id}`}>Nuevo periodo</Link></div> : null}
    {tab === "periodos" ? <RecordGrid empty="No hay periodos mensuales registrados.">
      {periods.map((period) => <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={period.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{monthNames[period.month - 1]} {period.year}</h3><p className="mt-1 text-sm text-slate-500">Creado {formatDateTime(period.createdAt)}</p></div><PeriodBadge status={period.status} /></div>{period.notes ? <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">{period.notes}</p> : null}<Link className="mt-5 inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" href={`/periodos/${period.id}`}>Ver periodo</Link></article>)}
    </RecordGrid> : null}

    {tab === "productos" ? <ProductCatalog companyId={id} products={products} search={productSearch} status={productStatus} /> : null}

    {tab === "ordenes" ? <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Configuración de órdenes</h2><p className="mt-1 text-sm text-slate-500">Identidad, numeración, impuestos, firmas y textos para futuras órdenes de compra.</p><dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2"><Line label="Siguiente folio" value={formatNextOrderNumber(orderSettings?.orderPrefix ?? null, orderSettings?.nextOrderNumber ?? 1)} /><Line label="IVA predeterminado" value={`${Number(orderSettings?.defaultTaxRate ?? "16.00").toLocaleString("es-MX", { maximumFractionDigits: 2 })}%`} /><Line label="Logo" value={orderSettings?.logoUrl ? "Configurado" : "Sin configurar"} /><Line label="Estado" value={orderSettings ? "Configuración guardada" : "Usando valores iniciales"} /></dl></div><Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700" href={`/empresas/${id}/configuracion-ordenes`}>Editar configuración</Link></div></section> : null}
  </div>;
}

function GeneralSection({ company }: { company: Awaited<ReturnType<typeof getCompany>> & {} }) {
  if (!company) return null;
  return <>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <InfoGroup title="Identificación"><Detail label="Nombre comercial" value={company.name} /><Detail label="Razón social" value={company.legalName} /><Detail label="RFC" value={company.taxId} /></InfoGroup>
      <InfoGroup title="Contacto"><ContactDetail label="Correos" values={company.emails} /><ContactDetail label="Teléfonos" values={company.phones} /><Detail label="Página web" value={company.website} /></InfoGroup>
      <InfoGroup title="Información corporativa"><Detail label="Fecha de constitución" value={company.incorporationDate ? formatDateOnly(company.incorporationDate) : null} /><Detail label="Número de escritura" value={company.deedNumber} /><Detail label="Notaría" value={company.notary} /><Detail label="Fecha de alta" value={formatDateTime(company.createdAt)} /></InfoGroup>
      <InfoGroup title="Domicilio fiscal"><Detail label="Dirección completa" value={company.fiscalAddress} /></InfoGroup>
      <InfoGroup className="lg:col-span-2" title="Observaciones"><Detail label="Notas administrativas" value={company.observations} /></InfoGroup>
    </div>
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-semibold text-slate-900">Estado del expediente</h2><p className="mt-1 text-sm text-slate-500">La empresa se desactiva sin eliminar su información relacionada.</p></div>
        <form action={setCompanyStatusAction}><input name="id" type="hidden" value={company.id} /><input name="isActive" type="hidden" value={String(!company.isActive)} /><button className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto" type="submit">{company.isActive ? "Desactivar empresa" : "Activar empresa"}</button></form>
      </div>
    </section>
  </>;
}

function InfoGroup({ children, className = "", title }: { children: ReactNode; className?: string; title: string }) {
  return <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 ${className}`}><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">{title}</h2></div><dl className="grid gap-5 p-5 sm:grid-cols-2">{children}</dl></section>;
}

function ContactDetail({ label, values }: { label: string; values: string[] }) {
  return <div><dt className="text-xs font-medium text-slate-400">{label}</dt><dd className="mt-2 flex flex-wrap gap-2">{values.length ? values.map((value) => <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700" key={value}>{value}</span>) : <span className="text-sm text-slate-500">—</span>}</dd></div>;
}

const documentCategories = ["Corporativos", "Fiscales", "Identificación", "Domicilio", "Bancarios", "Otros"] as const;

function DocumentGroups({ companyId, documents }: { companyId: number; documents: CompanyDocument[] }) {
  return <div className="mt-5 grid gap-5 xl:grid-cols-2">{documentCategories.map((category) => {
    const records = documents.filter((record) => documentCategory(record.documentType) === category);
    return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" key={category}><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h3 className="font-semibold text-slate-900">{category}</h3><span className="text-xs text-slate-400">{records.length} archivo{records.length === 1 ? "" : "s"}</span></div>{records.length ? <div className="divide-y divide-slate-100">{records.map((record) => <DocumentCard companyId={companyId} key={record.id} record={record} />)}</div> : <div className="px-5 py-8 text-center"><DocumentBadge label="Faltante" tone="amber" /><p className="mt-3 text-sm text-slate-500">No hay documentos en esta categoría.</p></div>}</section>;
  })}</div>;
}

function DocumentCard({ companyId, record }: { companyId: number; record: CompanyDocument }) {
  const state = documentState(record);
  const openUrl = record.fileUrl ?? record.externalUrl;
  return <article className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-medium text-slate-400">{documentTypes.find((type) => type.value === record.documentType)?.label ?? record.documentType}</p><h4 className="mt-1 font-semibold text-slate-900">{record.documentName}</h4>{record.representativeName ? <p className="mt-1 text-xs text-cyan-700">Relacionado con {record.representativeName}</p> : null}</div><DocumentBadge label={state.label} tone={state.tone} /></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><Line label="Emisión" value={record.documentDate ? formatDateOnly(record.documentDate) : null} /><Line label="Vencimiento" value={record.expirationDate ? formatDateOnly(record.expirationDate) : null} /><Line label="Archivo" value={record.fileName ?? (record.externalUrl ? "Referencia externa" : null)} /><Line label="Carga" value={formatDateTime(record.uploadedAt ?? record.createdAt)} /></dl>{record.observations ? <p className="mt-3 text-sm text-slate-600">{record.observations}</p> : null}<div className="mt-4 flex flex-wrap gap-2">{openUrl ? <a className="rounded-lg border border-cyan-200 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-50" href={openUrl} rel="noreferrer" target="_blank">Ver / descargar</a> : null}<Link className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" href={`/empresas/${companyId}/editar/documentos/${record.id}`}>{record.fileId ? "Editar / reemplazar" : "Editar / cargar archivo"}</Link><form action={setDossierStatusAction}><input name="companyId" type="hidden" value={companyId} /><input name="recordId" type="hidden" value={record.id} /><input name="section" type="hidden" value="documentos" /><input name="isActive" type="hidden" value={String(!record.isActive)} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" type="submit">{record.isActive ? "Inactivar" : "Reactivar"}</button></form></div></article>;
}

function documentState(record: CompanyDocument): { label: string; tone: "amber" | "emerald" | "red" | "slate" } {
  if (!record.isActive) return { label: "Inactivo", tone: "slate" };
  if (record.expirationDate) {
    const days = Math.ceil((new Date(`${record.expirationDate}T23:59:59`).getTime() - Date.now()) / 86_400_000);
    if (days < 0) return { label: "Vencido", tone: "red" };
    if (days <= 30) return { label: "Próximo a vencer", tone: "amber" };
  }
  return record.fileUrl || record.externalUrl ? { label: "Disponible", tone: "emerald" } : { label: "Faltante", tone: "amber" };
}

function DocumentBadge({ label, tone }: { label: string; tone: "amber" | "emerald" | "red" | "slate" }) {
  const colors = { amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-700", slate: "bg-slate-100 text-slate-600" };
  return <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>{label}</span>;
}

function DossierSectionHeader({ companyId, description, section, title }: { companyId: number; description: string; section: DossierSection; title: string }) {
  return <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div><Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700" href={`/empresas/${companyId}/nuevo/${section}`}>Agregar registro</Link></div>;
}

function RecordGrid({ children, empty }: { children: ReactNode; empty: string }) {
  const records = Array.isArray(children) ? children : children ? [children] : [];
  return records.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{children}</div> : <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{empty}</p>;
}

function RecordCard({ active, children, companyId, editHref, recordId, section, subtitle, title }: { active: boolean; children: ReactNode; companyId: number; editHref: string; recordId: number; section: DossierSection; subtitle: string; title: string }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div><StatusBadge active={active} /></div><div className="mt-4 space-y-2 border-t border-slate-100 pt-4">{children}</div><div className="mt-5 flex flex-wrap gap-2"><Link className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" href={editHref}>Editar</Link><form action={setDossierStatusAction}><input name="companyId" type="hidden" value={companyId} /><input name="recordId" type="hidden" value={recordId} /><input name="section" type="hidden" value={section} /><input name="isActive" type="hidden" value={String(!active)} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" type="submit">{active ? "Desactivar" : "Activar"}</button></form></div></article>;
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />{active ? "Activo" : "Inactivo"}</span>;
}

function PeriodBadge({ status }: { status: PeriodStatus }) {
  const tone = status === "open" ? "bg-emerald-50 text-emerald-700" : status === "review" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{periodStatusLabels[status]}</span>;
}

function Line({ label, value }: { label: string; value: string | null }) {
  return value ? <p className="text-sm text-slate-700"><span className="font-medium text-slate-400">{label}:</span> {value}</p> : null;
}

function Detail({ className = "", label, value }: { className?: string; label: string; value: string | null }) {
  return <div className={className}><dt className="text-xs font-medium text-slate-400">{label}</dt><dd className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-800">{value || "—"}</dd></div>;
}

function formatDateOnly(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { dateStyle: "long" });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });
}
