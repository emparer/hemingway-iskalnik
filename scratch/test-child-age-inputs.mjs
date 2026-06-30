import test from "node:test";
import assert from "node:assert/strict";

const {
  getChildAgesFromDefaults,
  resizeChildAges,
  serializeTravelerAges,
} = await import("../lib/child-ages.ts");

test("hydrates child ages from adult-prefixed Ages values", () => {
  assert.deepEqual(
    getChildAgesFromDefaults({
      defaultAges: "30,30,5,12",
      adultCount: 2,
      childCount: 2,
    }),
    [5, 12]
  );
});

test("backfills missing child ages with zero", () => {
  assert.deepEqual(
    getChildAgesFromDefaults({
      defaultAges: "30,30,7",
      adultCount: 2,
      childCount: 3,
    }),
    [7, 0, 0]
  );
});

test("treats child-only Ages values as child ages", () => {
  assert.deepEqual(
    getChildAgesFromDefaults({
      defaultAges: "4,9",
      adultCount: 2,
      childCount: 2,
    }),
    [4, 9]
  );
});

test("recovers child age from partially adult-prefixed Ages values", () => {
  assert.deepEqual(
    getChildAgesFromDefaults({
      defaultAges: "30,7",
      adultCount: 2,
      childCount: 1,
    }),
    [7]
  );
});

test("recovers child age from malformed adult-prefixed Ages values", () => {
  assert.deepEqual(
    getChildAgesFromDefaults({
      defaultAges: "30,,7",
      adultCount: 2,
      childCount: 1,
    }),
    [7]
  );
});

test("ignores malformed tokens before recovering child ages", () => {
  assert.deepEqual(
    getChildAgesFromDefaults({
      defaultAges: "30,x,7",
      adultCount: 2,
      childCount: 1,
    }),
    [7]
  );
});

test("resizes child ages with zero defaults for newly added children", () => {
  assert.deepEqual(resizeChildAges([6], 3), [6, 0, 0]);
});

test("truncates child ages when child count decreases", () => {
  assert.deepEqual(resizeChildAges([6, 11, 15], 2), [6, 11]);
});

test("normalizes blank and out-of-range child input values", () => {
  assert.deepEqual(resizeChildAges([NaN, -1, 22], 3), [0, 0, 17]);
});

test("fills missing child ages with zero before serialization after resize", () => {
  const resized = resizeChildAges([5], 3);

  assert.deepEqual(resized, [5, 0, 0]);
  assert.equal(
    serializeTravelerAges({
      adultCount: 2,
      childCount: 3,
      childAges: resized,
    }),
    "30,30,5,0,0"
  );
});

test("serializes missing child ages as zero when child count exceeds provided ages", () => {
  assert.equal(
    serializeTravelerAges({
      adultCount: 2,
      childCount: 3,
      childAges: [5],
    }),
    "30,30,5,0,0"
  );
});

test("serializes adult placeholders followed by exact child ages", () => {
  assert.equal(
    serializeTravelerAges({
      adultCount: 2,
      childCount: 3,
      childAges: [6, 11, 15],
    }),
    "30,30,6,11,15"
  );
});

test("clamps invalid ages into the supported range", () => {
  assert.equal(
    serializeTravelerAges({
      adultCount: 2,
      childCount: 3,
      childAges: [-2, 8, 99],
    }),
    "30,30,0,8,17"
  );
});

test("returns an empty age string when there are no children", () => {
  assert.equal(
    serializeTravelerAges({
      adultCount: 2,
      childCount: 0,
      childAges: [4],
    }),
    ""
  );
});
