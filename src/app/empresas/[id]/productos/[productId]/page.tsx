import Link from "next/link";
import { notFound } from "next/navigation";

import { getCompany } from "@/features/companies/service";
import { parseCompanyId } from "@/features/companies/validation";
import { setProductStatusAction } from "@/features/products/actions";
import { getProduct } from "@/features/products/service";
import { parseProductId } from "@/features/products/validation";
import { validateActiveCompany } from "@/features/company-context/service";

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export default async function ProductDetailPage({ params, searchParams }: PageProps<"/empresas/[id]/productos/[productId]">) {
  const route = await params;
  const companyId = parseCompanyId(route.id);
  const productId = parseProductId(route.productId);
  if (!companyId || !productId) notFound();
  await validateActiveCompany(companyId);
  const [company, product] = await Promise.all([getCompany(companyId), getProduct(companyId, productId)]);
  if (!company || !product) notFound();
  const query = await searchParams;
  const message = query.message === "created" ? "El producto se creó correctamente." : query.message === "updated" ? "El producto se actualizó correctamente." : null;

  return <div className="mx-auto max-w-4xl">
    {message ? <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">{company.name} / Productos</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{product.name}</h1><Status active={product.isActive} /></div><p className="mt-2 text-sm text-slate-500">{product.sku ?? "Sin referencia"}</p></div><div className="flex flex-wrap gap-2"><Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" href={`/empresas/${companyId}?tab=productos`}>Volver</Link><Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700" href={`/empresas/${companyId}/productos/${productId}/editar`}>Editar</Link></div></div>
    <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><dl className="grid sm:grid-cols-2"><Detail label="Referencia / SKU" value={product.sku} /><Detail label="Unidad" value={product.unit} /><Detail label="Precio unitario" value={money.format(Number(product.unitPrice))} /><Detail label="IVA predeterminado" value={product.taxRate === null ? "Por definir en la orden" : `${Number(product.taxRate).toLocaleString("es-MX", { maximumFractionDigits: 2 })}%`} /><Detail className="sm:col-span-2" label="Descripción" value={product.description} /><Detail className="sm:col-span-2" label="Observaciones" value={product.notes} /></dl></section>
    <section className="mt-5 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40"><div className="border-b border-amber-100 px-5 py-4"><h2 className="text-sm font-semibold text-amber-950">Costo y margen internos</h2><p className="mt-1 text-xs text-amber-700">Estos datos no aparecen en las órdenes ni en sus PDF.</p></div><dl className="grid sm:grid-cols-2"><Detail label="Costo de compra" value={product.purchaseCost === null ? null : money.format(Number(product.purchaseCost))} /><Detail label="Margen estimado" value={product.defaultMarginPercentage === null ? null : `${Number(product.defaultMarginPercentage).toLocaleString("es-MX", { maximumFractionDigits: 2 })}%`} /></dl></section>
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Estado del producto</h2><p className="mt-1 text-sm text-slate-500">Se conserva el registro aunque se desactive.</p></div><form action={setProductStatusAction}><input name="companyId" type="hidden" value={companyId} /><input name="productId" type="hidden" value={productId} /><input name="isActive" type="hidden" value={String(!product.isActive)} /><button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" type="submit">{product.isActive ? "Desactivar producto" : "Activar producto"}</button></form></div></section>
  </div>;
}

function Detail({ className = "", label, value }: { className?: string; label: string; value: string | null }) {
  return <div className={`border-b border-slate-100 p-5 sm:p-6 sm:odd:border-r ${className}`}><dt className="text-xs font-medium text-slate-400">{label}</dt><dd className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-800">{value || "—"}</dd></div>;
}

function Status({ active }: { active: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{active ? "Activo" : "Inactivo"}</span>;
}
