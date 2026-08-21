import assert from "node:assert/strict";
import test from "node:test";

import { validateClientForm, validatePayrollUpload } from "./validation.ts";

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
  form.set("periodMonth", "8");
  form.set("periodYear", "2026");
  form.set("payrollFile", new File(["texto"], "nomina.txt", { type: "text/plain" }));
  assert.equal(validatePayrollUpload(form).success, false);
});
