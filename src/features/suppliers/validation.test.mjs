import assert from "node:assert/strict";
import test from "node:test";

import { validateSupplierForm } from "./validation.ts";

test("limpia y valida los datos reutilizables del proveedor", () => {
  const form = new FormData();
  form.set("legalName", "  Proveedor Ejemplo, S.A. de C.V.  ");
  form.set("taxId", "  abc010101aa1  ");
  form.set("phone", "  5555555555  ");

  const result = validateSupplierForm(form);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.legalName, "Proveedor Ejemplo, S.A. de C.V.");
    assert.equal(result.data.taxId, "ABC010101AA1");
  }

  form.set("legalName", "   ");
  assert.equal(validateSupplierForm(form).success, false);
});
