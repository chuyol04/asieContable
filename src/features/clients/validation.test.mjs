import assert from "node:assert/strict";
import test from "node:test";

import { parsePeriodFilter, validateClientForm, validatePayrollUpload } from "./validation.ts";

test("normaliza el correo del cliente", () => {
  const form = new FormData();
  form.set("name", " ASAF ");
  form.set("userEmail", " Usuario@Ejemplo.com ");
  const result = validateClientForm(form);
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.userEmail, "usuario@ejemplo.com");
});

test("rechaza tipos de archivo distintos de PDF o Excel", () => {
  const form = new FormData();
  form.set("payrollCompanyId", "1");
  form.set("periodMonth", "8");
  form.set("periodYear", "2026");
  form.set("payrollFiles", new File(["texto"], "nomina.txt", { type: "text/plain" }));
  assert.equal(validatePayrollUpload(form).success, false);
});

test("acepta varios archivos con la misma fecha y observación", () => {
  const form = new FormData();
  form.set("payrollCompanyId", "9");
  form.set("periodMonth", "8");
  form.set("periodYear", "2026");
  form.set("payrollDate", "2026-08-20");
  form.set("notes", "Depósitos del mismo día");
  form.append("payrollFiles", new File(["pdf"], "deposito-1.pdf", { type: "application/pdf" }));
  form.append("payrollFiles", new File(["excel"], "deposito-2.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const result = validatePayrollUpload(form);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.files.length, 2);
    assert.equal(result.data.payrollCompanyId, 9);
    assert.equal(result.data.notes, "Depósitos del mismo día");
  }
});

test("requiere seleccionar una empresa de nómina", () => {
  const form = new FormData();
  form.set("periodMonth", "8");
  form.set("periodYear", "2026");
  form.set("payrollFiles", new File(["pdf"], "nomina.pdf", { type: "application/pdf" }));
  assert.equal(validatePayrollUpload(form).success, false);
});

test("normaliza los filtros del reporte de nóminas", () => {
  assert.deepEqual(parsePeriodFilter("2026", "8", "  nomina semanal  ", "2026-08-15"), {
    year: 2026,
    month: 8,
    name: "nomina semanal",
    date: "2026-08-15",
  });
  assert.equal(parsePeriodFilter("", "", "", "fecha-invalida").date, null);
});
