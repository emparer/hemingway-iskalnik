import test from "node:test";
import assert from "node:assert/strict";

const { getMinimumServiceCodes } = await import("../lib/service-codes.ts");

test("maps overnight minimum to ORS service ladder", () => {
  assert.deepEqual(getMinimumServiceCodes("OV"), ["OV", "UF", "HP", "VP", "AI"]);
});

test("maps breakfast and half-board to ORS service codes", () => {
  assert.deepEqual(getMinimumServiceCodes("BB"), ["UF", "HP", "VP", "AI"]);
  assert.deepEqual(getMinimumServiceCodes("HB"), ["HP", "VP", "AI"]);
});

test("maps all-inclusive and empty selection", () => {
  assert.deepEqual(getMinimumServiceCodes("AI"), ["AI"]);
  assert.deepEqual(getMinimumServiceCodes(""), []);
});
