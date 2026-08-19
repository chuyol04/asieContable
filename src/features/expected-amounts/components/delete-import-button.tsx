"use client";

import { deleteExpectedAmountImportAction } from "../actions";

export function DeleteImportButton({ importId, periodId, reconciledCount }: { importId: number; periodId: number; reconciledCount: number }) {
  return <form action={deleteExpectedAmountImportAction} onSubmit={(event) => { if (!window.confirm(`¿Eliminar esta importación y sus montos esperados?${reconciledCount ? " Tiene conciliaciones y no podrá eliminarse." : ""}`)) event.preventDefault(); }}><input name="importId" type="hidden" value={importId} /><input name="periodId" type="hidden" value={periodId} /><button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50" type="submit">Eliminar Excel</button></form>;
}
