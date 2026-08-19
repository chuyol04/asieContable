import Link from "next/link";
import { notFound } from "next/navigation";

import { listProducts } from "@/features/products/service";
import { listSuppliers } from "@/features/suppliers/service";
import { updatePurchaseOrderAction } from "@/features/purchase-orders/actions";
import { PurchaseOrderForm } from "@/features/purchase-orders/components/purchase-order-form";
import { getPurchaseOrder } from "@/features/purchase-orders/service";
import { parsePurchaseOrderId } from "@/features/purchase-orders/validation";
import { validateActiveCompany } from "@/features/company-context/service";

export default async function EditPurchaseOrderPage({ params }: PageProps<"/ordenes-compra/[id]/editar">) {
  const { id: rawId } = await params;
  const id = parsePurchaseOrderId(rawId);
  if (!id) notFound();
  const order = await getPurchaseOrder(id);
  if (!order) notFound();
  await validateActiveCompany(order.companyId);
  if (order.status !== "draft") return <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold text-amber-900">La orden ya no puede editarse</h1><p className="mt-2 text-sm text-amber-800">Sólo las órdenes en borrador permiten cambios.</p><Link className="mt-5 inline-flex rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white" href={`/ordenes-compra/${id}`}>Volver al detalle</Link></div>;
  if (order.items.some((item) => !item.productId)) return <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6"><h1 className="text-xl font-semibold text-red-900">No es posible editar esta orden</h1><p className="mt-2 text-sm text-red-800">Una partida perdió la referencia a su producto. El snapshot permanece visible en el detalle.</p></div>;
  const [products, suppliers] = await Promise.all([listProducts(order.companyId, "", "active"), listSuppliers(order.companyId)]);
  return <div><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">{order.companyName} / Órdenes</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Editar {order.orderNumber}</h1><p className="mt-2 text-sm text-slate-500">Los datos históricos del producto se conservan; sólo cambia esta orden.</p></div><PurchaseOrderForm action={updatePurchaseOrderAction.bind(null, id)} cancelHref={`/ordenes-compra/${id}`} companyName={order.companyName} initialLines={order.items.map((item) => ({ key: `item-${item.id}`, itemId: item.id, productId: item.productId!, reference: item.productReference, name: item.productName, description: item.description, unit: item.unit, taxRate: item.taxRate, quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount }))} initialValues={{ orderDate: order.orderDate, deliveryDate: order.deliveryDate, supplierLegalName: order.supplierLegalName, supplierTaxId: order.supplierTaxId ?? "", supplierAddress: order.supplierAddress ?? "", supplierPhone: order.supplierPhone ?? "", notes: order.notes ?? "" }} orderNumber={order.orderNumber} products={products} submitLabel="Guardar cambios" supplierCreateHref={`/proveedores/nuevo?companyId=${order.companyId}`} suppliers={suppliers} /></div>;
}
