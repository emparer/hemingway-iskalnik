import test from "node:test";
import assert from "node:assert/strict";

const { hasQuickSearchMatches, shouldFallbackToAnyQuickSearch } = await import("../lib/quicksearch-results.ts");

test("detects populated quicksearch results", () => {
  assert.equal(
    hasQuickSearchMatches({
      Results: {
        Locations: [{ LocationID: 1 }],
        Regions: [],
        Products: [],
      },
    }),
    true
  );
});

test("treats empty or missing quicksearch results as no match", () => {
  assert.equal(hasQuickSearchMatches({ RequestID: "x" }), false);
  assert.equal(
    hasQuickSearchMatches({
      Results: {
        Locations: [],
        Regions: [],
        Products: [],
      },
    }),
    false
  );
});

test("falls back to any quicksearch only when typed search has no matches", () => {
  assert.equal(shouldFallbackToAnyQuickSearch("hotel", { RequestID: "x" }), false);
  assert.equal(shouldFallbackToAnyQuickSearch("pauschal", { RequestID: "x" }), true);
  assert.equal(
    shouldFallbackToAnyQuickSearch("hotel", {
      Results: { Locations: [{ LocationID: 1 }], Regions: [], Products: [] },
    }),
    false
  );
  assert.equal(shouldFallbackToAnyQuickSearch("any", { RequestID: "x" }), false);
});
