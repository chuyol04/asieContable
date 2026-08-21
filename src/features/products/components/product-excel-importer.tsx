"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { readSheet } from "read-excel-file/browser";

import type { ProductImportState } from "../types";

type ImportAction = (state: ProductImportState, formData: FormData) => Promise<ProductImportState>;
type Cell = unknown;

export function ProductExcelImporter({ action }: { action: ImportAction }) {
  const [state, formAction, pending] = useActionState(action, { message: "" });
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Cell[][]>([]);
  const [nameIndex, setNameIndex] = useState(0);
  const [headerRowNumber, setHeaderRowNumber] = useState(1);
  const [readError, setReadError] = useState("");

  const preview = useMemo(() => {
    const seen = new Set<string>();
    return rows.map((row, index) => {
      const name = cellText(row[nameIndex]);
      const key = name.toLocaleLowerCase("es-MX");
      const duplicate = Boolean(name && seen.has(key));
      if (name) seen.add(key);
      return {
        duplicate,
        name,
        rowNumber: headerRowNumber + index + 1,
        valid: Boolean(name && name.length <= 191),
      };
    });
  }, [headerRowNumber, nameIndex, rows]);
  const invalidCount = preview.filter((row) => !row.valid).length;
  const duplicateCount = preview.filter((row) => row.duplicate).length;
  const names = preview.filter((row) => row.valid && !row.duplicate).map((row) => row.name);

  async function readFile(file: File | undefined) {
    setHeaders([]);
    setRows([]);
    setReadError("");
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setReadError("El Excel no debe exceder 10 MB.");
      return;
    }
    try {
      const sheet = await readSheet(file, { trim: true });
      const firstRow = sheet.findIndex((row) => row.some((cell) => cellText(cell) !== ""));
      if (firstRow < 0) throw new Error("EMPTY");
      const sourceHeaders = uniqueHeaders(sheet[firstRow]);
      const dataRows = sheet.slice(firstRow + 1).filter((row) => row.some((cell) => cellText(cell) !== ""));
      if (!dataRows.length || dataRows.length > 2_000) throw new Error("ROWS");
      setHeaders(sourceHeaders);
      setRows(dataRows);
      setHeaderRowNumber(firstRow + 1);
      setNameIndex(suggestNameColumn(sourceHeaders));
    } catch {
      setReadError("No fue posible leer el archivo. Usa un .xlsx con encabezados y máximo 2000 productos.");
    }
  }

  return <div className="space-y-5">
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-sm font-semibold text-slate-900">1. Selecciona el Excel</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">La primera fila debe contener encabezados. Solo necesitas una columna llamada Nombre o Producto. El archivo se procesa en tu navegador y no se almacena.</p>
      <input accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-4 file:py-2.5 file:font-semibold file:text-cyan-700" onChange={(event) => void readFile(event.target.files?.[0])} type="file" />
    </section>
    {readError ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{readError}</p> : null}

    {headers.length ? <form action={formAction} className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">2. Confirma la columna del producto</h2>
        <label className="mt-4 block text-xs font-semibold text-slate-600">Columna NOMBRE
          <select className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm" onChange={(event) => setNameIndex(Number(event.target.value))} value={nameIndex}>{headers.map((header, index) => <option key={`${header}-${index}`} value={index}>{header}</option>)}</select>
        </label>
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">3. Vista previa</h2><p className="mt-1 text-xs text-slate-500">{preview.length} filas · {names.length} productos por crear · {duplicateCount} duplicados dentro del archivo</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Fila</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Resultado</th></tr></thead><tbody className="divide-y divide-slate-100">{preview.slice(0, 50).map((row) => <tr key={row.rowNumber}><td className="px-4 py-3 text-slate-500">{row.rowNumber}</td><td className="px-4 py-3 font-semibold text-slate-900">{row.name || "—"}</td><td className={`px-4 py-3 text-xs font-semibold ${!row.valid ? "text-red-700" : row.duplicate ? "text-amber-700" : "text-emerald-700"}`}>{!row.valid ? "Nombre inválido" : row.duplicate ? "Duplicado; se omitirá" : "Listo"}</td></tr>)}</tbody></table></div>
        {preview.length > 50 ? <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Se muestran las primeras 50 filas; se procesarán todas.</p> : null}
      </section>
      <section className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm text-cyan-900"><p className="font-semibold">Valores iniciales</p><p className="mt-1 text-xs leading-5">Precio $0.00, IVA sin definir y unidad “POR DEFINIR”. En cada orden podrás capturar precio, IVA, cantidad, descuento y unidad sin modificar el catálogo original.</p></section>
      {state.message ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{state.message}</p> : null}
      <input name="names" type="hidden" value={JSON.stringify(names)} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-100" href="/productos">Cancelar</Link><button className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50" disabled={pending || invalidCount > 0 || names.length === 0} type="submit">{pending ? "Guardando…" : `Crear ${names.length} productos`}</button></div>
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

function suggestNameColumn(headers: string[]): number {
  const suggested = headers.findIndex((header) => /nombre|producto|descripci[oó]n/i.test(header));
  return suggested >= 0 ? suggested : 0;
}

function cellText(value: Cell): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}
