import assert from "node:assert/strict";
import test from "node:test";

import { formatNextOrderNumber, validatePurchaseOrderSettings } from "./validation.ts";

test("valida la configuración sin consumir la numeración", () => {
  const form = new FormData();
  form.set("companyName", " OMEGA ");
  form.set("nextOrderNumber", "191");
  form.set("defaultTaxRate", "16");
  form.set("leftSignatureText", "ELABORADO POR");
  form.set("rightSignatureText", "ACEPTADA");
  const result = validatePurchaseOrderSettings(form);
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.settings.defaultTaxRate, "16.00");
  assert.equal(formatNextOrderNumber("OC", 191), "OC-191");
});
