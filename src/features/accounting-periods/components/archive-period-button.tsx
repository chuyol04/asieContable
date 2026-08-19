"use client";

import { archivePeriodAction } from "../actions";

export function ArchivePeriodButton({ companyId, periodId }: { companyId: number; periodId: number }) {
  return <form action={archivePeriodAction} onSubmit={(event) => { if (!window.confirm("¿Eliminar este periodo? Primero debes eliminar sus importaciones de Excel y cualquier otro movimiento relacionado.")) event.preventDefault(); }}><input name="id" type="hidden" value={periodId} /><input name="companyId" type="hidden" value={companyId} /><button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50" type="submit">Eliminar</button></form>;
}
