import assert from "node:assert/strict";
import test from "node:test";

import { isClientAllowedPath, isTrustedOrigin, safeInternalPath } from "./security.ts";

test("solo acepta solicitudes del mismo origen", () => {
  assert.equal(isTrustedOrigin("http://localhost:3001", "http://localhost:3001"), true);
  assert.equal(isTrustedOrigin("https://phantocontable.systems", ["https://phantocontable.systems", "https://www.phantocontable.systems"]), true);
  assert.equal(isTrustedOrigin("https://otro-sitio.example", "http://localhost:3001"), false);
  assert.equal(isTrustedOrigin("no-es-url", "http://localhost:3001"), false);
});

test("solo permite rutas internas para redirecciones", () => {
  assert.equal(safeInternalPath("/periodos?year=2026"), "/periodos?year=2026");
  assert.equal(safeInternalPath("https://sitio-malicioso.example"), "/");
  assert.equal(safeInternalPath("//sitio-malicioso.example"), "/");
  assert.equal(safeInternalPath("/\\sitio-malicioso.example"), "/");
});

test("el cliente solo puede abrir su portal y la descarga protegida de nominas", () => {
  assert.equal(isClientAllowedPath("/mis-nominas"), true);
  assert.equal(isClientAllowedPath("/api/nominas/12/download"), true);
  assert.equal(isClientAllowedPath("/api/nominas/12/delete"), false);
  assert.equal(isClientAllowedPath("/api/nominas/otro/download"), false);
  assert.equal(isClientAllowedPath("/clientes"), false);
});
