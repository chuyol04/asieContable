import { getCashDelivery, getDeliverySignatureReference } from "@/features/cash-deliveries/service";
import { getActiveCompanyId } from "@/features/company-context/service";
import { readSignatureFile } from "@/features/cash-deliveries/signature-storage";
import { parseDeliveryId } from "@/features/cash-deliveries/validation";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/entregas/[id]/firma">) {
  const id = parseDeliveryId((await context.params).id);
  if (!id) return new Response("Not found", { status: 404 });
  const delivery = await getCashDelivery(id);
  if (!delivery || delivery.companyId !== await getActiveCompanyId()) return new Response("Not found", { status: 404 });
  const reference = await getDeliverySignatureReference(id);
  const signature = reference ? await readSignatureFile(reference) : null;
  if (!signature) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(signature), { headers: { "Cache-Control": "private, no-store", "Content-Type": "image/svg+xml; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
}
