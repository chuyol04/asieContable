"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { readSheet } from "read-excel-file/browser";

import { moneyToCents, normalizeMoney } from "../money";
import type { ExpectedImportState } from "../types";

type ImportAction = (state: ExpectedImportState, formData: FormData) => Promise<ExpectedImportState>;
type Cell = unknown;

export function ExcelImporter({ action, periodId }: { action: ImportAction; periodId: number }) {
  const [state, formAction, pending] = useActionState(action, { message: "" });
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Cell[][]>([]);
  const [headerRowNumber, setHeaderRowNumber] = useState(1);
  const [amountIndex, setAmountIndex] = useState(0);
  const [readError, setReadError] = useState("");

  const preview = useMemo(() => rows.map((row, index) => {
    const amount = normalizeMoney(row[amountIndex]);
    const referenceData = Object.fromEntries(headers.map((header, column) => [header, cellText(row[column])]));
    return { sourceRowNumber: headerRowNumber + index + 1, amount, referenceData, valid: Boolean(amount && (moneyToCents(amount) ?? 0) > 0) };
  }), [amountIndex, headerRowNumber, headers, rows]);
  const invalidCount = preview.filter((row) => !row.valid).length;
  const importRows = preview.filter((row) => row.valid).map(({ sourceRowNumber, amount, referenceData }) => ({ sourceRowNumber, amount, referenceData }));

  async function readFile(file: File | undefined) {
    setReadError(""); setHeaders([]); setRows([]); setFileName(file?.name ?? "");
    if (!file) return;
    try {
      const sheet = await readSheet(file, { trim: true });
      const firstRow = sheet.findIndex((row) => row.some((cell) => cellText(cell) !== ""));
      if (firstRow < 0) throw new Error("El archivo está vacío.");
      const sourceHeaders = uniqueHeaders(sheet[firstRow]);
      const dataRows = sheet.slice(firstRow + 1).filter((row) => row.some((cell) => cellText(cell) !== ""));
      if (!dataRows.length) throw new Error("El archivo no contiene filas de datos.");
      setHeaders(sourceHeaders);
      setRows(dataRows);
      setHeaderRowNumber(firstRow + 1);
      setAmountIndex(suggestAmountColumn(sourceHeaders, dataRows));
    } catch {
      setReadError("No fue posible leer el archivo Excel. Verifica que sea un archivo .xlsx válido.");
    }
  }

  return <div className="space-y-5">
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-sm font-semibold text-slate-900">1. Selecciona el archivo</h2><p className="mt-1 text-xs text-slate-500">Se procesa en tu navegador y no se almacena. Formato admitido: .xlsx</p><input accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-4 file:py-2.5 file:font-semibold file:text-cyan-700" onChange={(event) => void readFile(event.target.files?.[0])} type="file" /></section>
    {readError ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{readError}</p> : null}

    {headers.length ? <form action={formAction} className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-sm font-semibold text-slate-900">2. Confirma la columna de importe</h2><label className="mt-4 block text-xs font-semibold text-slate-600">Columna IMPORTE<select className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm" name="amountColumnSelect" onChange={(event) => setAmountIndex(Number(event.target.value))} value={amountIndex}>{headers.map((header, index) => <option key={`${header}-${index}`} value={index}>{header}</option>)}</select></label><p className="mt-2 text-xs text-cyan-700">Sugerencia automática: {headers[amountIndex]}</p></section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">3. Vista previa</h2><p className="mt-1 text-xs text-slate-500">{preview.length} filas detectadas · {invalidCount ? `${invalidCount} con importe inválido` : "todas listas para importar"}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Fila</th><th className="px-4 py-3">Importe normalizado</th><th className="px-4 py-3">Referencias</th><th className="px-4 py-3">Validación</th></tr></thead><tbody className="divide-y divide-slate-100">{preview.slice(0, 50).map((row) => <tr key={row.sourceRowNumber}><td className="px-4 py-3 text-slate-500">{row.sourceRowNumber}</td><td className="px-4 py-3 font-semibold text-slate-900">{row.amount ?? "—"}</td><td className="px-4 py-3 text-xs text-slate-500">{Object.entries(row.referenceData).filter(([, value]) => value).slice(0, 4).map(([key, value]) => `${key}: ${value}`).join(" · ") || "—"}</td><td className={`px-4 py-3 text-xs font-semibold ${row.valid ? "text-emerald-700" : "text-red-700"}`}>{row.valid ? "Lista" : "Importe inválido"}</td></tr>)}</tbody></table></div>{preview.length > 50 ? <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Se muestran las primeras 50 filas; se guardarán las {preview.length}.</p> : null}</section>
      {state.message ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{state.message}</p> : null}
      <input name="sourceName" type="hidden" value={fileName} /><input name="amountColumn" type="hidden" value={headers[amountIndex]} /><input name="rows" type="hidden" value={JSON.stringify(importRows)} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-100" href={`/periodos/${periodId}/montos-esperados`}>Cancelar</Link><button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50" disabled={pending || invalidCount > 0 || importRows.length === 0} type="submit">{pending ? "Guardando…" : `Importar ${importRows.length} filas`}</button></div>
    </form> : null}
  </div>;
}

function uniqueHeaders(row: Cell[]): string[] {
  const counts = new Map<string, number>();
  return row.map((cell, index) => {
    const base = cellText(cell) || `Columna ${index + 1}`;
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });
}

function suggestAmountColumn(headers: string[], rows: Cell[][]): number {
  const keywords = /(^|\s)(importe|monto|amount|total)(\s|$)/;
  const named = headers.findIndex((header) => keywords.test(header.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()));
  if (named >= 0) return named;
  const scores = headers.map((_, column) => rows.slice(0, 100).filter((row) => normalizeMoney(row[column])).length);
  return scores.indexOf(Math.max(...scores));
}

function cellText(value: Cell): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}
