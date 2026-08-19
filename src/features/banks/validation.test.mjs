import assert from "node:assert/strict";
import test from "node:test";

import { parseBankId, parseBankStatus, validateBankForm } from "./validation.ts";

test("normaliza y valida los datos de un banco", () => {
  const valid = new FormData();
  valid.set("name", "  BBVA  ");
  valid.set("shortName", "  BBVA MX  ");

  assert.deepEqual(validateBankForm(valid), {
    success: true,
    data: { name: "BBVA", shortName: "BBVA MX" },
  });

  const blank = new FormData();
  blank.set("name", "   ");
  assert.equal(validateBankForm(blank).success, false);
  assert.equal(parseBankStatus("unexpected"), "active");
  assert.equal(parseBankStatus("inactive"), "inactive");
  assert.equal(parseBankId("12"), 12);
  assert.equal(parseBankId("0"), null);
});
