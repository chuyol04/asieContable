"use client";

import { cancelCashDeliveryAction } from "../actions";

export function CancelDeliveryForm({ id, periodId }: { id: number; periodId: number }) {
  return <form action={cancelCashDeliveryAction} onSubmit={(event) => { if (!window.confirm("¿Cancelar esta entrega? Dejará de sumar al total entregado, pero conservará su historial.")) event.preventDefault(); }}><input name="id" type="hidden" value={id} /><input name="periodId" type="hidden" value={periodId} /><button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50" type="submit">Cancelar</button></form>;
}
