import assert from "node:assert/strict";
import test from "node:test";

import { parsePeriodStatus, parsePeriodYear, validatePeriodForm } from "./validation.ts";

test("valida y normaliza un periodo mensual", () => {
  const form = new FormData();
  form.set("companyId", "1");
  form.set("month", "8");
  form.set("year", "2026");
  form.set("notes", "  Operación agosto  ");
  assert.deepEqual(validatePeriodForm(form), {
    success: true,
    data: { companyId: 1, month: 8, year: 2026, notes: "Operación agosto" },
  });

  form.set("month", "13");
  assert.equal(validatePeriodForm(form).success, false);
  assert.equal(parsePeriodYear("1899"), null);
  assert.equal(parsePeriodStatus("closed"), "closed");
  assert.equal(parsePeriodStatus("invalid"), "all");
});
