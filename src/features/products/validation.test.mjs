import assert from "node:assert/strict";
import test from "node:test";

import { validateProductForm } from "./validation.ts";

test("normaliza y valida un producto", () => {
  const form = new FormData();
  form.set("sku", "  AL-01  ");
  form.set("name", "  ALAMBRE DE PACA  ");
  form.set("unit", "  PZA  ");
  form.set("unitPrice", "$ 30.24");
  form.set("taxRate", "16");

  const result = validateProductForm(form);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, "ALAMBRE DE PACA");
    assert.equal(result.data.unitPrice, "30.24");
    assert.equal(result.data.taxRate, "16.00");
  }

  form.set("unitPrice", "-0.01");
  assert.equal(validateProductForm(form).success, false);

  form.set("unitPrice", "30.24");
  form.set("taxRate", "");
  const withoutTax = validateProductForm(form);
  assert.equal(withoutTax.success, true);
  if (withoutTax.success) assert.equal(withoutTax.data.taxRate, null);
});
