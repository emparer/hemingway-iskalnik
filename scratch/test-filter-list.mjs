import test from "node:test";
import assert from "node:assert/strict";

const { normalizeFilterList } = await import("../lib/filter-list.ts");

test("keeps valid object-backed filter entries", () => {
  const result = normalizeFilterList({
    "441": { Value: "Dubrovnik" },
    "442": { Name: "Split" },
  });

  assert.deepEqual(result, [
    { ID: "441", Name: "Dubrovnik" },
    { ID: "442", Name: "Split" },
  ]);
});

test("drops invalid object-backed filter entries", () => {
  const result = normalizeFilterList({
    "5761552": { Value: null },
    "5761553": {},
  });

  assert.deepEqual(result, []);
});

test("drops array entries whose labels are objects", () => {
  const result = normalizeFilterList([
    { ID: "1", Value: { bad: true } },
    { ID: "2", Name: "Athens" },
  ]);

  assert.deepEqual(result, [{ ID: "2", Name: "Athens" }]);
});
