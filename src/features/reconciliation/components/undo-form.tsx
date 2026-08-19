"use client";

import { undoReconciliationAction } from "../actions";

export function UndoReconciliationForm({ periodId, reconciliationId }: { periodId: number; reconciliationId: number }) {
  return <form action={undoReconciliationAction} onSubmit={(event) => { if (!window.confirm("¿Deshacer esta conciliación? El monto esperado volverá a pendiente y el depósito quedará disponible.")) event.preventDefault(); }}><input name="periodId" type="hidden" value={periodId} /><input name="reconciliationId" type="hidden" value={reconciliationId} /><button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50" type="submit">Deshacer</button></form>;
}
