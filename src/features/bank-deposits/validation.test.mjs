import assert from "node:assert/strict";
import test from "node:test";

import { parseDepositStatus, parseMultipleAmounts, validateDepositForm } from "./validation.ts";

test("normaliza captura múltiple sin eliminar importes repetidos", () => {
  const parsed = parseMultipleAmounts("25000\n25000\n10000.98\n$ 5,568.00");
  assert.deepEqual(parsed, { amounts: ["25000.00", "25000.00", "10000.98", "5568.00"], invalidLines: [] });

  const form = new FormData();
  form.set("companyId", "1");
  form.set("accountingPeriodId", "1");
  form.set("bankAccountId", "1");
  form.set("depositDate", "2026-08-07");
  form.set("amount", "$ 5,568.00");
  const valid = validateDepositForm(form);
  assert.equal(valid.success, true);
  if (valid.success) assert.deepEqual(valid.amounts, ["5568.00"]);

  form.set("depositDate", "2026-02-30");
  assert.equal(validateDepositForm(form).success, false);
  assert.equal(parseDepositStatus("available"), "available");
  assert.equal(parseDepositStatus("other"), null);
});
