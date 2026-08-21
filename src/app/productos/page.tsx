import { getActiveCompanyId } from "@/features/company-context/service";
import { ProductCatalog } from "@/features/products/components/product-catalog";
import { listProducts } from "@/features/products/service";
import { parseProductStatus } from "@/features/products/validation";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: PageProps<"/productos">) {
  const query = await searchParams;
  const companyId = await getActiveCompanyId();
  const search = typeof query.search === "string" ? query.search.trim().slice(0, 191) : "";
  const status = parseProductStatus(query.status);
  const products = companyId ? await listProducts(companyId, search, status) : [];
  const created = safeCount(query.created);
  const skipped = safeCount(query.skipped);
  return <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Compras / Catálogo</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Productos</h1><p className="mt-2 text-sm text-slate-500">Catálogo para órdenes de compra. No representa existencias físicas.</p>{query.message === "imported" ? <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Se crearon {created} productos.{skipped ? ` Se omitieron ${skipped} porque ya existían.` : ""}</p> : null}{companyId ? <ProductCatalog companyId={companyId} products={products} search={search} standalone status={status} /> : <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Selecciona una empresa activa desde el encabezado.</p>}</div>;
}

function safeCount(value: unknown): number {
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}
