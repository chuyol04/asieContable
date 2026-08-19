"use client";

import Link from "next/link";
import { useMemo, useState, useActionState } from "react";

import type { Product } from "@/features/products/types";
import type { Supplier } from "@/features/suppliers/types";
import { calculatePurchaseOrder, calculatePurchaseOrderItem } from "../calculations";
import type { PurchaseOrderFormAction, PurchaseOrderFormState } from "../types";

export interface OrderEditorLine {
  key: string;
  itemId: number | null;
  productId: number;
  reference: string | null;
  name: string;
  description: string;
  unit: string;
  taxRate: string;
  quantity: string;
  unitPrice: string;
  discount: string;
}

export interface OrderEditorValues {
  orderDate: string;
  deliveryDate: string;
  supplierLegalName: string;
  supplierTaxId: string;
  supplierAddress: string;
  supplierPhone: string;
  notes: string;
}

const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";

export function PurchaseOrderForm({ action, cancelHref, companyName, initialLines = [], initialValues, orderNumber, products, submitLabel, supplierCreateHref, suppliers }: { action: PurchaseOrderFormAction; cancelHref: string; companyName: string; initialLines?: OrderEditorLine[]; initialValues: OrderEditorValues; orderNumber: string; products: Product[]; submitLabel: string; supplierCreateHref: string; suppliers: Supplier[] }) {
  const [state, formAction, pending] = useActionState(action, { message: "" } as PurchaseOrderFormState);
  const [lines, setLines] = useState(initialLines);
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierValues, setSupplierValues] = useState({ legalName: initialValues.supplierLegalName, taxId: initialValues.supplierTaxId, address: initialValues.supplierAddress, phone: initialValues.supplierPhone });
  const visibleProducts = products.filter((product) => `${product.sku ?? ""} ${product.name}`.toLocaleLowerCase("es-MX").includes(search.toLocaleLowerCase("es-MX")));
  const calculation = useMemo(() => {
    try { return calculatePurchaseOrder(lines.map((line) => ({ quantity: line.quantity, unitPrice: line.unitPrice, discount: line.discount, taxRate: line.taxRate }))); }
    catch { return { items: [], subtotal: "0.00", discountTotal: "0.00", taxTotal: "0.00", total: "0.00" }; }
  }, [lines]);

  function addProduct() {
    const product = products.find((item) => item.id === Number(selectedProductId));
    if (!product) return;
    setLines((current) => [...current, { key: crypto.randomUUID(), itemId: null, productId: product.id, reference: product.sku, name: product.name, description: product.description, unit: product.unit, taxRate: product.taxRate ?? "0.00", quantity: "1.0000", unitPrice: product.unitPrice, discount: "0.00" }]);
    setSelectedProductId("");
  }

  function selectSupplier(id: string) {
    setSelectedSupplierId(id);
    const supplier = suppliers.find((item) => item.id === Number(id));
    if (supplier) setSupplierValues({ legalName: supplier.legalName, taxId: supplier.taxId ?? "", address: supplier.fiscalAddress ?? "", phone: supplier.phone ?? "" });
  }

  function updateLine(key: string, field: "quantity" | "unitPrice" | "discount" | "taxRate", value: string) { setLines((current) => current.map((line) => line.key === key ? { ...line, [field]: value } : line)); }
  function removeLine(key: string) { setLines((current) => current.filter((line) => line.key !== key)); }

  return <form action={formAction} className="space-y-6">
    <input name="items" type="hidden" value={JSON.stringify(lines.map(({ itemId, productId, quantity, unitPrice, discount, taxRate }) => ({ itemId, productId, quantity, unitPrice, discount, taxRate })))} />
    {state.message ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{state.message}</p> : null}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="text-sm font-semibold text-slate-900">Orden y proveedor</h2><p className="mt-1 text-xs text-slate-500">{companyName} · Folio {orderNumber}</p></div><div className="space-y-5 p-5 sm:p-6"><div className="rounded-lg border border-cyan-100 bg-cyan-50/60 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-xs font-semibold text-slate-600">Proveedor registrado<select className={inputClass} onChange={(event) => selectSupplier(event.target.value)} value={selectedSupplierId}><option value="">Capturar manualmente</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.legalName}{supplier.taxId ? ` · ${supplier.taxId}` : ""}</option>)}</select></label><Link className="rounded-lg border border-cyan-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-cyan-800" href={supplierCreateHref} target="_blank">Nuevo proveedor</Link></div><p className="mt-2 text-xs text-cyan-800">Al seleccionarlo se llenan automáticamente razón social, RFC, teléfono y domicilio.</p></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Fecha de expedición" name="orderDate" required type="date" value={initialValues.orderDate} /><Field label="Fecha de entrega" name="deliveryDate" required type="date" value={initialValues.deliveryDate} /><Field label="Razón social del proveedor" maxLength={255} name="supplierLegalName" onChange={(value) => setSupplierValues((current) => ({ ...current, legalName: value }))} required value={supplierValues.legalName} /><Field label="RFC" maxLength={32} name="supplierTaxId" onChange={(value) => setSupplierValues((current) => ({ ...current, taxId: value }))} value={supplierValues.taxId} /><Field label="Teléfono" maxLength={32} name="supplierPhone" onChange={(value) => setSupplierValues((current) => ({ ...current, phone: value }))} type="tel" value={supplierValues.phone} /></div><TextArea label="Domicilio fiscal" name="supplierAddress" onChange={(value) => setSupplierValues((current) => ({ ...current, address: value }))} value={supplierValues.address} /><TextArea label="Observaciones" name="notes" value={initialValues.notes} /></div></section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="text-sm font-semibold text-slate-900">Partidas</h2><p className="mt-1 text-xs text-slate-500">El precio modificado se guarda sólo en esta orden.</p></div><div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end"><label className="text-xs font-semibold text-slate-600">Buscar producto<input className={inputClass} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o referencia" value={search} /></label><label className="text-xs font-semibold text-slate-600">Producto<select className={inputClass} onChange={(event) => setSelectedProductId(event.target.value)} value={selectedProductId}><option value="">Selecciona un producto</option>{visibleProducts.map((product) => <option key={product.id} value={product.id}>{product.sku ? `${product.sku} · ` : ""}{product.name}</option>)}</select></label><button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50" disabled={!selectedProductId} onClick={addProduct} type="button">Agregar</button></div>
      {lines.length ? <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Producto</th><th className="px-3 py-3">Precio unitario</th><th className="px-3 py-3">Cantidad</th><th className="px-3 py-3">Descuento ($)</th><th className="px-3 py-3">IVA (%)</th><th className="px-3 py-3">Total</th><th className="px-4 py-3">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{lines.map((line, index) => <tr key={line.key}><td className="px-4 py-4"><p className="font-semibold text-slate-900">{line.name}</p><p className="mt-1 text-xs text-slate-500">{line.reference ?? "Sin referencia"} · {line.unit}</p>{line.description ? <p className="mt-1 max-w-xs text-xs text-slate-400">{line.description}</p> : null}</td><EditableCells line={line} onChange={updateLine} /><td className="px-3 py-4 font-semibold tabular-nums text-slate-900">{formatMoney(calculation.items[index]?.total ?? safeItemTotal(line))}</td><td className="px-4 py-4"><button className="text-xs font-semibold text-red-600 hover:underline" onClick={() => removeLine(line.key)} type="button">Eliminar</button></td></tr>)}</tbody></table></div><div className="divide-y divide-slate-100 md:hidden">{lines.map((line, index) => <article className="space-y-4 p-4" key={line.key}><div><p className="font-semibold text-slate-900">{line.name}</p><p className="mt-1 text-xs text-slate-500">{line.reference ?? "Sin referencia"} · {line.unit}</p></div><div className="grid grid-cols-2 gap-3"><MobileField label="Precio" value={line.unitPrice} onChange={(value) => updateLine(line.key, "unitPrice", value)} /><MobileField label="Cantidad" value={line.quantity} onChange={(value) => updateLine(line.key, "quantity", value)} /><MobileField label="Descuento ($)" value={line.discount} onChange={(value) => updateLine(line.key, "discount", value)} /><MobileField label="IVA (%)" value={line.taxRate} onChange={(value) => updateLine(line.key, "taxRate", value)} /><div><p className="text-xs font-semibold text-slate-500">Total</p><p className="mt-3 font-semibold text-slate-900">{formatMoney(calculation.items[index]?.total ?? safeItemTotal(line))}</p></div></div><button className="text-xs font-semibold text-red-600" onClick={() => removeLine(line.key)} type="button">Eliminar partida</button></article>)}</div></> : <p className="p-8 text-center text-sm text-slate-500">Agrega al menos un producto a la orden.</p>}
    </section>
    <section className="ml-auto max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><dl className="space-y-3"><TotalLine label="Subtotal" value={calculation.subtotal} /><TotalLine label="Descuento" value={calculation.discountTotal} /><TotalLine label="IVA" value={calculation.taxTotal} /><TotalLine emphasis label="Total" value={calculation.total} /></dl></section>
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-100" href={cancelHref}>Cancelar</Link><button className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60" disabled={pending || !lines.length} type="submit">{pending ? "Guardando…" : submitLabel}</button></div>
  </form>;
}

function EditableCells({ line, onChange }: { line: OrderEditorLine; onChange: (key: string, field: "quantity" | "unitPrice" | "discount" | "taxRate", value: string) => void }) { return <><td className="px-3 py-4"><SmallInput label="Precio unitario" value={line.unitPrice} onChange={(value) => onChange(line.key, "unitPrice", value)} /></td><td className="px-3 py-4"><SmallInput label="Cantidad" value={line.quantity} onChange={(value) => onChange(line.key, "quantity", value)} /></td><td className="px-3 py-4"><SmallInput label="Descuento" value={line.discount} onChange={(value) => onChange(line.key, "discount", value)} /></td><td className="px-3 py-4"><SmallInput label="IVA" value={line.taxRate} onChange={(value) => onChange(line.key, "taxRate", value)} /></td></>; }
function SmallInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) { return <input aria-label={label} className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm" inputMode="decimal" onChange={(event) => onChange(event.target.value)} value={value} />; }
function MobileField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) { return <label className="text-xs font-semibold text-slate-500">{label}<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" inputMode="decimal" onChange={(event) => onChange(event.target.value)} value={value} /></label>; }
function Field({ label, maxLength, name, onChange, required = false, type = "text", value }: { label: string; maxLength?: number; name: string; onChange?: (value: string) => void; required?: boolean; type?: string; value: string }) { const control = onChange ? { value, onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value) } : { defaultValue: value }; return <label className="block text-xs font-semibold text-slate-600">{label}{required ? <span className="text-red-600"> *</span> : null}<input className={inputClass} maxLength={maxLength} name={name} required={required} type={type} {...control} /></label>; }
function TextArea({ label, name, onChange, value }: { label: string; name: string; onChange?: (value: string) => void; value: string }) { const control = onChange ? { value, onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value) } : { defaultValue: value }; return <label className="block text-xs font-semibold text-slate-600">{label}<textarea className={inputClass} maxLength={5_000} name={name} rows={3} {...control} /></label>; }
function TotalLine({ emphasis = false, label, value }: { emphasis?: boolean; label: string; value: string }) { return <div className={`flex items-center justify-between ${emphasis ? "border-t border-slate-200 pt-3 text-lg font-bold text-slate-950" : "text-sm text-slate-600"}`}><dt>{label}</dt><dd className="tabular-nums">{formatMoney(value)}</dd></div>; }
function safeItemTotal(line: OrderEditorLine): string { try { return calculatePurchaseOrderItem(line).total; } catch { return "0.00"; } }
function formatMoney(value: string): string { const [integer, decimals = "00"] = value.split("."); return `$${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimals}`; }
