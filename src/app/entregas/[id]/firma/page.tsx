import { notFound } from "next/navigation";

import { SignaturePad } from "@/features/cash-deliveries/components/signature-pad";
import { getCashDelivery } from "@/features/cash-deliveries/service";
import { parseDeliveryId } from "@/features/cash-deliveries/validation";
import { validateActiveCompany } from "@/features/company-context/service";

const errors: Record<string, string> = { "invalid-signature": "Dibuja una firma válida antes de guardar.", DELIVERY_LOCKED: "La entrega ya fue firmada o cancelada.", DELIVERY_NOT_FOUND: "La entrega ya no existe.", "save-failed": "No fue posible guardar la firma." };

export default async function DeliverySignaturePage({ params, searchParams }: PageProps<"/entregas/[id]/firma">) {
  const id = parseDeliveryId((await params).id); if (!id) notFound();
  const delivery = await getCashDelivery(id); if (!delivery || delivery.status !== "pending_signature") notFound();
  await validateActiveCompany(delivery.companyId);
  const query = await searchParams; const error = typeof query.error === "string" ? errors[query.error] : null;
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Entregas / Firma</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Firma de recepción</h1><p className="mb-6 mt-2 text-sm text-slate-500">{`Folio ENT-${String(id).padStart(6, "0")} · ${delivery.receivedBy} · ${formatMoney(delivery.amount)}`}</p><SignaturePad deliveryId={id} error={error} /></div>;
}

function formatMoney(value: string): string { const [integer, decimals] = value.split("."); return `$${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimals}`; }
