import test from "node:test";
import assert from "node:assert/strict";

const { buildFallbackSearchTarget } = await import("../lib/search-target.ts");

test("keeps default region group when fallback has one", () => {
  assert.deepEqual(
    buildFallbackSearchTarget("Croatia", "100023"),
    {
      query: "Croatia",
      RegionGroup: "100023",
    }
  );
});

test("uses product name fallback when no region scope exists", () => {
  assert.deepEqual(
    buildFallbackSearchTarget("Spain", ""),
    {
      query: "Spain",
      RegionGroup: "",
      ProductName: "Spain",
    }
  );
});

test("handles empty query without inventing product name", () => {
  assert.deepEqual(
    buildFallbackSearchTarget("", ""),
    {
      query: "",
      RegionGroup: "",
    }
  );
});
