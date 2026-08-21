import assert from "node:assert/strict";
import test from "node:test";

import { parseProductNameCsv, validateProductForm, validateProductImport } from "./validation.ts";

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

test("valida una carga de nombres y elimina duplicados dentro del archivo", () => {
  const form = new FormData();
  form.set("names", JSON.stringify(["  Bolsa blanca  ", "BOLSA BLANCA", "Bolsa negra"]));

  const result = validateProductImport(form);
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual(result.names, ["Bolsa blanca", "Bolsa negra"]);

  form.set("names", JSON.stringify([""]));
  assert.equal(validateProductImport(form).success, false);
});

test("lee la plantilla CSV de una sola columna", () => {
  assert.deepEqual(parseProductNameCsv("\uFEFFNombre\r\nBolsa blanca\r\nBolsa negra"), [["Nombre"], ["Bolsa blanca"], ["Bolsa negra"]]);
});
