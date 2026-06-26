import test from "node:test";
import assert from "node:assert/strict";

const { resolveTourOperator } = await import("../lib/tour-operator.ts");

test("prefers the explicit search param operator", () => {
  const result = resolveTourOperator({
    searchParams: { TourOperator: "EXP" },
    matchingItem: {
      TourOperator: "ITEM",
      Product: { TourOperator: "PROD" },
      TourOperators: { ALT: true },
    },
  });

  assert.equal(result, "EXP");
});

test("falls back through result-level operator sources", () => {
  assert.equal(
    resolveTourOperator({
      searchParams: {},
      matchingItem: { TourOperator: "ITEM" },
    }),
    "ITEM"
  );

  assert.equal(
    resolveTourOperator({
      searchParams: {},
      matchingItem: { Product: { TourOperator: "PROD" } },
    }),
    "PROD"
  );

  assert.equal(
    resolveTourOperator({
      searchParams: {},
      matchingItem: { TourOperators: { ALT: true } },
    }),
    "ALT"
  );
});

test("does not invent a default operator when none exists", () => {
  const result = resolveTourOperator({
    searchParams: {},
    matchingItem: {},
  });

  assert.equal(result, "");
});
