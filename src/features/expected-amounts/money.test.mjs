import assert from "node:assert/strict";
import test from "node:test";

import { buildMatchPlan, normalizeMoney } from "./money.ts";

test("normaliza dinero sin usar punto flotante", () => {
  for (const value of ["$ 5,568.00", "5,568.00", 5568, 5568.0]) {
    assert.equal(normalizeMoney(value), "5568.00");
  }
  assert.equal(normalizeMoney("1000.929"), "1000.93");
  assert.equal(normalizeMoney("sin importe"), null);
});

test("respeta ocurrencias y deja las similares como sugerencias", () => {
  const expected = Array.from({ length: 10 }, (_, index) => ({ id: index + 1, amount: "25000.00" }));
  const deposits = Array.from({ length: 5 }, (_, index) => ({ id: index + 101, amount: "25000.00" }));
  const repeated = buildMatchPlan(expected, deposits);
  assert.equal(repeated.exactMatches.length, 5);
  assert.equal(repeated.unmatchedExpected.length, 5);

  const similar = buildMatchPlan([{ id: 1, amount: "1000.98" }], [{ id: 2, amount: "1000.93" }]);
  assert.equal(similar.exactMatches.length, 0);
  assert.equal(similar.similarSuggestions[0].candidates[0].difference, "0.05");

  const excluded = buildMatchPlan(expected, deposits, { expectedAmountIds: [1], bankDepositIds: [101] });
  assert.equal(excluded.exactMatches.length, 4);

  const firstDay = repeated.exactMatches;
  const secondDay = buildMatchPlan(expected, [...deposits, ...Array.from({ length: 5 }, (_, index) => ({ id: index + 106, amount: "25000.00" }))], {
    expectedAmountIds: firstDay.map((item) => item.expectedAmountId),
    bankDepositIds: firstDay.map((item) => item.bankDepositId),
  });
  assert.equal(secondDay.exactMatches.length, 5);

  const priority = buildMatchPlan([{ id: 1, amount: "1000.98" }, { id: 2, amount: "1000.93" }], [{ id: 3, amount: "1000.93" }]);
  assert.equal(priority.exactMatches[0].expectedAmountId, 2);
  assert.equal(priority.similarSuggestions.length, 0);

  const ambiguous = buildMatchPlan([{ id: 1, amount: "1000.98" }], [{ id: 2, amount: "1000.93" }, { id: 3, amount: "1001.02" }]);
  assert.deepEqual(ambiguous.similarSuggestions[0].candidates.map((item) => item.bankDepositId), [3, 2]);
});
