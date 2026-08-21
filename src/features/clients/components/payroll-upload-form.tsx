"use client";

import { useActionState } from "react";

import type { PayrollFormAction, PayrollFormState } from "../types";

const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100";
const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function PayrollUploadForm({ action, initialMonth, initialYear }: { action: PayrollFormAction; initialMonth: number; initialYear: number }) {
  const [state, formAction, pending] = useActionState(action, { message: "" } as PayrollFormState);
  return <form action={formAction} className="space-y-5">
    {state.message ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p> : null}
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-xs font-semibold text-slate-600">Mes *<select className={inputClass} defaultValue={initialMonth} name="periodMonth" required>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Año *<input className={inputClass} defaultValue={initialYear} max={2200} min={2000} name="periodYear" required type="number" /></label>
      <label className="text-xs font-semibold text-slate-600">Fecha de nómina<input className={inputClass} name="payrollDate" type="date" /></label>
      <label className="text-xs font-semibold text-slate-600">Archivos *<input accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className={inputClass} multiple name="payrollFiles" required type="file" /><span className="mt-1 block font-normal text-slate-400">Hasta 10 PDF, XLS o XLSX; máximo 20 MB cada uno y 100 MB por carga.</span></label>
    </div>
    <label className="block text-xs font-semibold text-slate-600">Observación visible para el cliente<textarea className={inputClass} maxLength={5_000} name="notes" placeholder="Ejemplo: Depósitos correspondientes al 15 de agosto." rows={3} /><span className="mt-1 block font-normal text-slate-400">Se aplicará a todos los archivos seleccionados.</span></label>
    <div className="flex justify-end"><button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Subiendo…" : "Subir archivos"}</button></div>
  </form>;
}
