import assert from "node:assert/strict";
import test from "node:test";

import { calculatePurchaseOrder } from "./calculations.ts";

test("calcula subtotal, descuento, IVA y total con decimales exactos", () => {
  const result = calculatePurchaseOrder([{ quantity: "100", unitPrice: "30.24", discount: "0", taxRate: "16" }]);
  assert.deepEqual({ subtotal: result.subtotal, discount: result.discountTotal, tax: result.taxTotal, total: result.total }, { subtotal: "3024.00", discount: "0.00", tax: "483.84", total: "3507.84" });
});
