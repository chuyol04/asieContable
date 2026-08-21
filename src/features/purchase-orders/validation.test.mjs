import assert from "node:assert/strict";
import test from "node:test";

import { canTransitionPurchaseOrderStatus, validatePurchaseOrderForm } from "./validation.ts";

test("acepta IVA por partida y rechaza porcentajes fuera de rango", () => {
  const form = new FormData();
  form.set("orderDate", "2026-08-18");
  form.set("deliveryDate", "2026-08-18");
  form.set("supplierLegalName", "Proveedor");
  form.set("items", JSON.stringify([{ itemId: null, productId: 1, unit: "CAJA", quantity: "2", unitPrice: "50", discount: "0", taxRate: "8" }]));

  const valid = validatePurchaseOrderForm(form);
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.items[0].taxRate, "8.00");
    assert.equal(valid.data.items[0].unit, "CAJA");
  }

  form.set("items", JSON.stringify([{ itemId: null, productId: 1, unit: "CAJA", quantity: "2", unitPrice: "50", discount: "0", taxRate: "101" }]));
  assert.equal(validatePurchaseOrderForm(form).success, false);
});

test("solo elimina documentos al realizar una cancelación válida", () => {
  assert.equal(canTransitionPurchaseOrderStatus("draft", "cancelled"), true);
  assert.equal(canTransitionPurchaseOrderStatus("confirmed", "cancelled"), true);
  assert.equal(canTransitionPurchaseOrderStatus("confirmed", "confirmed"), false);
  assert.equal(canTransitionPurchaseOrderStatus("cancelled", "cancelled"), false);
});
