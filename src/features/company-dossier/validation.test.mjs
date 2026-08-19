import assert from "node:assert/strict";
import test from "node:test";

import { parseDossierSection, validateCoverTemplateFile, validateDocumentFile, validateDossierForm } from "./validation.ts";

test("valida los registros del expediente", () => {
  const representative = new FormData();
  representative.set("fullName", "  Ana López  ");
  representative.set("position", "  Apoderada  ");
  const valid = validateDossierForm("representantes", representative);
  assert.equal(valid.success, true);
  if (valid.success) assert.equal(valid.data.fullName, "Ana López");

  const account = new FormData();
  account.set("bankId", "1");
  account.set("alias", "Principal");
  account.set("accountNumber", "123");
  account.set("clabe", "123");
  account.set("branch", "Centro");
  account.set("plaza", "Monterrey");
  account.set("currency", "mxn");
  account.set("holder", "OMEGA");
  assert.equal(validateDossierForm("cuentas", account).success, false);

  const document = new FormData();
  document.set("documentType", "acta_constitutiva");
  document.set("documentName", "Acta");
  document.set("documentDate", "2026-02-30");
  assert.equal(validateDossierForm("documentos", document).success, false);
  document.set("documentDate", "");
  assert.equal(validateDossierForm("documentos", document).success, true);
  assert.match(validateDocumentFile(new File(["secret"], "firma.key")).message, /llaves privadas/);
  assert.equal(validateCoverTemplateFile(new File(["pdf"], "caratula.pdf", { type: "application/pdf" })).file?.name, "caratula.pdf");
  assert.equal(validateCoverTemplateFile(new File([new Uint8Array(20 * 1024 * 1024)], "limite.pdf", { type: "application/pdf" })).message, undefined);
  assert.match(validateCoverTemplateFile(new File([new Uint8Array(20 * 1024 * 1024 + 1)], "excedido.pdf", { type: "application/pdf" })).message, /20 MB/);
  assert.match(validateCoverTemplateFile(new File(["image"], "caratula.png", { type: "image/png" })).message, /PDF/);
  assert.equal(parseDossierSection("periodos"), null);
});
