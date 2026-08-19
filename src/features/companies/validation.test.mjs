import assert from "node:assert/strict";
import test from "node:test";

import { parseCompanyId, parseCompanyStatus, validateCompanyForm } from "./validation.ts";

test("normaliza y valida los datos de una empresa", () => {
  const valid = new FormData();
  valid.set("name", "  OMEGA  ");
  valid.set("legalName", "  Omega SA de CV  ");
  valid.set("emails", "ADMIN@OMEGA.MX\nadmin@omega.mx\ncontabilidad@omega.mx");
  valid.set("phones", "81 1234 5678\n81 1234 5678");

  assert.deepEqual(validateCompanyForm(valid), {
    success: true,
    data: {
      name: "OMEGA",
      legalName: "Omega SA de CV",
      taxId: null,
      fiscalAddress: null,
      phones: ["81 1234 5678"],
      emails: ["admin@omega.mx", "contabilidad@omega.mx"],
      website: null,
      incorporationDate: null,
      notary: null,
      deedNumber: null,
      observations: null,
    },
  });

  const blank = new FormData();
  blank.set("name", "   ");
  assert.equal(validateCompanyForm(blank).success, false);
  assert.equal(parseCompanyStatus("unexpected"), "active");
  assert.equal(parseCompanyStatus("inactive"), "inactive");
  assert.equal(parseCompanyId("12"), 12);
  assert.equal(parseCompanyId("0"), null);
});
