import { moneyToCents, normalizeMoney } from "./money";
import type { ExpectedImportRow } from "./types";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function validateExpectedImport(formData: FormData):
  | { success: true; sourceName: string | null; amountColumn: string; rows: ExpectedImportRow[] }
  | { success: false; message: string } {
  const sourceName = text(formData, "sourceName").slice(0, 255);
  const amountColumn = text(formData, "amountColumn").slice(0, 191);
  const rawRows = text(formData, "rows");
  if (!amountColumn || !rawRows) return { success: false, message: "Confirma la columna de importe y la vista previa." };

  let parsed: unknown;
  try { parsed = JSON.parse(rawRows); } catch { return { success: false, message: "La vista previa no es válida." }; }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 10_000) return { success: false, message: "La importación debe contener entre 1 y 10000 filas." };

  const rows: ExpectedImportRow[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") return { success: false, message: "Una fila de la importación no es válida." };
    const candidate = item as Record<string, unknown>;
    const sourceRowNumber = Number(candidate.sourceRowNumber);
    const amount = normalizeMoney(candidate.amount);
    const references = candidate.referenceData;
    if (!Number.isSafeInteger(sourceRowNumber) || sourceRowNumber < 2 || !amount || (moneyToCents(amount) ?? 0) <= 0 || !references || typeof references !== "object" || Array.isArray(references)) {
      return { success: false, message: `La fila ${sourceRowNumber || "indicada"} contiene datos inválidos.` };
    }
    const referenceData: Record<string, string> = {};
    const entries = Object.entries(references as Record<string, unknown>);
    if (entries.length > 100) return { success: false, message: `La fila ${sourceRowNumber} contiene demasiadas columnas.` };
    for (const [key, value] of entries) {
      const safeKey = key.trim().slice(0, 191);
      if (safeKey) referenceData[safeKey] = String(value ?? "").trim().slice(0, 2_000);
    }
    rows.push({ sourceRowNumber, amount, referenceData });
  }
  return { success: true, sourceName: sourceName || null, amountColumn, rows };
}
