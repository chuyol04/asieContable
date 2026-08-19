import Link from "next/link";

import { setProductStatusAction } from "../actions";
import type { Product, ProductStatusFilter } from "../types";

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function ProductCatalog({ companyId, products, search, standalone = false, status }: { companyId: number; products: Product[]; search: string; standalone?: boolean; status: ProductStatusFilter }) {
  return <>
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Productos</h2><p className="mt-1 text-sm text-slate-500">Catálogo propio de la empresa para futuras órdenes de compra.</p></div><Link className="rounded-lg bg-cyan-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700" href={`/empresas/${companyId}/productos/nuevo`}>Nuevo producto</Link></div>
    <form className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_180px_auto]" method="get">
      {standalone ? <input name="companyId" type="hidden" value={companyId} /> : <input name="tab" type="hidden" value="productos" />}
      <input aria-label="Buscar producto" className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-500" defaultValue={search} name="search" placeholder="Buscar por producto o referencia" />
      <select aria-label="Filtrar por estado" className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm" defaultValue={status} name="status"><option value="active">Activos</option><option value="inactive">Inactivos</option><option value="all">Todos</option></select>
      <button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" type="submit">Filtrar</button>
    </form>
    {products.length ? <>
      <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Referencia</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Precio unitario</th><th className="px-4 py-3">Unidad</th><th className="px-4 py-3">IVA</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{products.map((product) => <tr key={product.id}><td className="px-4 py-3 text-slate-500">{product.sku ?? "—"}</td><td className="px-4 py-3 font-semibold text-slate-900">{product.name}</td><td className="px-4 py-3 tabular-nums text-slate-700">{money.format(Number(product.unitPrice))}</td><td className="px-4 py-3 text-slate-600">{product.unit}</td><td className="px-4 py-3 text-slate-600">{formatTax(product.taxRate)}</td><td className="px-4 py-3"><Status active={product.isActive} /></td><td className="px-4 py-3"><Actions companyId={companyId} product={product} /></td></tr>)}</tbody></table></div>
      <div className="mt-5 grid gap-4 md:hidden">{products.map((product) => <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={product.id}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{product.sku ?? "Sin referencia"}</p><h3 className="mt-1 font-semibold text-slate-900">{product.name}</h3></div><Status active={product.isActive} /></div><dl className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-sm"><div><dt className="text-xs text-slate-400">Precio</dt><dd className="mt-1 font-medium">{money.format(Number(product.unitPrice))}</dd></div><div><dt className="text-xs text-slate-400">Unidad</dt><dd className="mt-1 font-medium">{product.unit}</dd></div><div><dt className="text-xs text-slate-400">IVA</dt><dd className="mt-1 font-medium">{formatTax(product.taxRate)}</dd></div></dl><div className="mt-4"><Actions companyId={companyId} product={product} /></div></article>)}</div>
    </> : <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No hay productos que coincidan con los filtros.</p>}
  </>;
}

function Actions({ companyId, product }: { companyId: number; product: Product }) {
  return <div className="flex flex-wrap gap-2"><Link className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" href={`/empresas/${companyId}/productos/${product.id}`}>Ver</Link><Link className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" href={`/empresas/${companyId}/productos/${product.id}/editar`}>Editar</Link><form action={setProductStatusAction}><input name="companyId" type="hidden" value={companyId} /><input name="productId" type="hidden" value={product.id} /><input name="isActive" type="hidden" value={String(!product.isActive)} /><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" type="submit">{product.isActive ? "Desactivar" : "Activar"}</button></form></div>;
}

function Status({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{active ? "Activo" : "Inactivo"}</span>;
}

function formatTax(value: string | null): string {
  return value === null ? "Por definir" : `${Number(value).toLocaleString("es-MX", { maximumFractionDigits: 2 })}%`;
}
