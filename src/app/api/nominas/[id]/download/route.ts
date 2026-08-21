import { getCurrentUser } from "@/features/auth/session";
import { getClientForUser, getPayrollFile } from "@/features/clients/service";
import { parseClientId } from "@/features/clients/validation";
import { downloadDriveFile, GoogleDriveError } from "@/features/purchase-orders/google-drive";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/nominas/[id]/download">) {
  const user = await getCurrentUser();
  if (!user) return new Response("No autorizado", { status: 401 });
  const payrollFileId = parseClientId((await context.params).id);
  if (!payrollFileId) return new Response("No encontrado", { status: 404 });
  const payroll = await getPayrollFile(payrollFileId);
  if (!payroll) return new Response("No encontrado", { status: 404 });

  if (user.role === "client") {
    const client = await getClientForUser(user.uid, user.email);
    if (!client || payroll.clientId !== client.id || !payroll.isActive) return new Response("No encontrado", { status: 404 });
  }

  try {
    const driveResponse = await downloadDriveFile(payroll.driveFileId);
    const asciiName = payroll.fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(payroll.fileName)}`,
      "Content-Type": payrollMimeType(payroll.fileType),
      "X-Content-Type-Options": "nosniff",
    });
    const contentLength = driveResponse.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);
    return new Response(driveResponse.body, { headers });
  } catch (error) {
    console.error(`[clients] Payroll download failed: ${error instanceof GoogleDriveError ? error.code : "UNKNOWN"}`);
    return new Response("No fue posible descargar el archivo.", { status: 502 });
  }
}

function payrollMimeType(type: "pdf" | "xls" | "xlsx"): string {
  return type === "pdf" ? "application/pdf" : type === "xls" ? "application/vnd.ms-excel" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}
