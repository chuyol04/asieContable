import { parseCompanyId } from "@/features/companies/validation";
import { readLogoFile } from "@/features/purchase-order-settings/logo-storage";
import { getPurchaseOrderLogoReference } from "@/features/purchase-order-settings/service";
import { getActiveCompanyId } from "@/features/company-context/service";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteContext<"/api/empresas/[id]/ordenes/logo">) {
  const { id: rawId } = await params;
  const companyId = parseCompanyId(rawId);
  if (!companyId) return new Response("No encontrado", { status: 404 });
  if (companyId !== await getActiveCompanyId()) return new Response("No encontrado", { status: 404 });
  const reference = await getPurchaseOrderLogoReference(companyId);
  const logo = reference ? await readLogoFile(reference) : null;
  if (!logo) return new Response("No encontrado", { status: 404 });
  return new Response(Uint8Array.from(logo.data), { headers: { "Content-Type": logo.contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
