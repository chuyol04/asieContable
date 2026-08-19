import assert from "node:assert/strict";
import test from "node:test";

import { validateDeliveryForm, validateSignature } from "./validation.ts";

test("normaliza entregas y valida firmas vectoriales", () => {
  const form = new FormData();
  form.set("companyId", "1"); form.set("accountingPeriodId", "2"); form.set("deliveryDate", "2026-08-17");
  form.set("storedAmount", "$ 1,250,000.00"); form.set("amount", "$ 1,000,000.00"); form.set("deliveredBy", "  Ana  "); form.set("receivedBy", " Luis ");
  const result = validateDeliveryForm(form);
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual({ storedAmount: result.data.storedAmount, amount: result.data.amount, deliveredBy: result.data.deliveredBy }, { storedAmount: "1250000.00", amount: "1000000.00", deliveredBy: "Ana" });
  form.set("amount", "1250000.01");
  assert.equal(validateDeliveryForm(form).success, false);
  assert.deepEqual(validateSignature('[[{"x":1,"y":2},{"x":3,"y":4}]]')?.length, 1);
  assert.equal(validateSignature('[[{"x":700,"y":2}]]'), null);
});
