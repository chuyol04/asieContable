import assert from "node:assert/strict";
import test from "node:test";

import { signedDifference } from "./validation.ts";

test("calcula diferencias monetarias firmadas en centavos", () => {
  assert.deepEqual(signedDifference("1000.98", "1000.93"), { value: "-0.05", absoluteCents: 5 });
  assert.deepEqual(signedDifference("1000.98", "1001.02"), { value: "0.04", absoluteCents: 4 });
});
