"use client";

import { setPurchaseOrderStatusAction } from "../actions";

export function PurchaseOrderStatusActions({ hasDriveFile, id, status }: { hasDriveFile: boolean; id: number; status: "draft" | "confirmed" }) {
  const cancellationMessage = hasDriveFile ? "¿Cancelar esta orden? El registro se conservará, pero su PDF se eliminará de Google Drive." : "¿Cancelar esta orden? El registro se conservará.";
  return <div className="flex flex-wrap gap-2">{status === "draft" ? <form action={setPurchaseOrderStatusAction} onSubmit={(event) => { if (!window.confirm("¿Confirmar esta orden? Después ya no podrá editarse.")) event.preventDefault(); }}><input name="id" type="hidden" value={id} /><input name="status" type="hidden" value="confirmed" /><button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700" type="submit">Confirmar orden</button></form> : null}<form action={setPurchaseOrderStatusAction} onSubmit={(event) => { if (!window.confirm(cancellationMessage)) event.preventDefault(); }}><input name="id" type="hidden" value={id} /><input name="status" type="hidden" value="cancelled" /><button className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50" type="submit">Cancelar orden</button></form></div>;
}
