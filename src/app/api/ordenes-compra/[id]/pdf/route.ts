import { getPurchaseOrderDocumentData } from "@/features/purchase-orders/document-data";
import { purchaseOrderPdfFilename, renderPurchaseOrderPdf } from "@/features/purchase-orders/pdf";
import { parsePurchaseOrderId } from "@/features/purchase-orders/validation";
import { getActiveCompanyId } from "@/features/company-context/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, { params }: RouteContext<"/api/ordenes-compra/[id]/pdf">) {
  const { id: rawId } = await params;
  const id = parsePurchaseOrderId(rawId);
  if (!id) return new Response("Orden no válida.", { status: 400 });

  const data = await getPurchaseOrderDocumentData(id);
  if (!data) return new Response("Orden no encontrada.", { status: 404 });
  const activeCompanyId = await getActiveCompanyId();
  if (data.order.companyId !== activeCompanyId) return new Response("Orden no encontrada.", { status: 404 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  if (download && data.order.status !== "confirmed") {
    return new Response("La descarga final solo está disponible para órdenes confirmadas.", { status: 409 });
  }

  try {
    const pdf = await renderPurchaseOrderPdf(data);
    const filename = purchaseOrderPdfFilename(data.company.name, data.order.orderNumber);
    return new Response(Uint8Array.from(pdf).buffer, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch {
    console.error("No fue posible generar el PDF de la orden.");
    return new Response("No fue posible generar el PDF.", { status: 500 });
  }
}
