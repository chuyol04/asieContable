import { markPurchaseOrderSentToAccountingAction, savePurchaseOrderToDriveAction } from "@/features/purchase-orders/drive-actions";
import type { PurchaseOrder } from "@/features/purchase-orders/types";

const driveErrors = new Set(["drive-not-configured", "drive-file-exists", "drive-upload-failed"]);

export function DriveDocumentCard({ errorCode, order }: { errorCode: string | null; order: PurchaseOrder }) {
  const hasDriveFile = Boolean(order.driveFileId && order.driveUrl);
  const uploadError = Boolean(errorCode && driveErrors.has(errorCode));
  const label = uploadError ? "Error de carga" : hasDriveFile ? "Guardado en Drive" : order.status === "confirmed" ? "Generado" : "No generado";
  const tone = uploadError ? "bg-red-50 text-red-700" : hasDriveFile ? "bg-emerald-50 text-emerald-700" : order.status === "confirmed" ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-600";
  const folderUrl = order.driveFolderId ? `https://drive.google.com/drive/folders/${encodeURIComponent(order.driveFolderId)}` : null;

  return <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Documento en Google Drive</h2><p className="mt-1 text-sm text-slate-500">Repositorio: Órdenes de compra / Empresa / Año / Mes</p></div><span className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span></div>
    <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Archivo" value={order.driveFileName} /><Field label="Fecha de carga" value={order.driveUploadedAt ? formatDateTime(order.driveUploadedAt) : null} /><Field label="Carpeta" value={order.driveFolderId ? `${order.companyName} / ${folderDate(order.orderDate)}` : null} /><Field label="Contabilidad" value={order.sentToAccountingAt ? `Enviada ${formatDateTime(order.sentToAccountingAt)}` : "Pendiente"} /></dl>
    <div className="mt-5 flex flex-wrap gap-2">
      {order.status === "confirmed" && !hasDriveFile ? <form action={savePurchaseOrderToDriveAction}><input name="id" type="hidden" value={order.id} /><button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700" type="submit">Guardar en Drive</button></form> : null}
      {hasDriveFile ? <><a className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700" href={order.driveUrl!} rel="noreferrer" target="_blank">Abrir en Drive</a>{folderUrl ? <a className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" href={folderUrl} rel="noreferrer" target="_blank">Abrir carpeta</a> : null}<form action={savePurchaseOrderToDriveAction}><input name="id" type="hidden" value={order.id} /><input name="mode" type="hidden" value="replace" /><button className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100" type="submit">Reemplazar PDF</button></form></> : null}
      {hasDriveFile && !order.sentToAccountingAt && order.status === "confirmed" ? <form action={markPurchaseOrderSentToAccountingAction}><input name="id" type="hidden" value={order.id} /><button className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100" type="submit">Marcar enviada a contabilidad</button></form> : null}
    </div>
    {hasDriveFile ? <p className="mt-3 text-xs text-slate-400">“Reemplazar PDF” actualiza explícitamente el mismo archivo de Drive; no crea otra copia.</p> : null}
  </section>;
}

function Field({ label, value }: { label: string; value: string | null }) { return <div><dt className="text-xs font-medium text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-700">{value || "—"}</dd></div>; }
function formatDateTime(value: Date): string { return value.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }); }
function folderDate(value: string): string { const [year, month] = value.split("-"); return `${year} / ${months[Number(month) - 1] ?? month}`; }
const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"] as const;
