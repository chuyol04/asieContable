"use client";

import { deletePayrollAction } from "../actions";

export function DeletePayrollButton({ clientId, payrollFileId }: { clientId: number; payrollFileId: number }) {
  return <form action={deletePayrollAction} onSubmit={(event) => {
    if (!window.confirm("¿Eliminar esta nómina? Se borrará el archivo de Google Drive y su registro; esta acción no se puede deshacer.")) event.preventDefault();
  }}>
    <input name="clientId" type="hidden" value={clientId} />
    <input name="payrollFileId" type="hidden" value={payrollFileId} />
    <button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50" type="submit">Eliminar</button>
  </form>;
}
