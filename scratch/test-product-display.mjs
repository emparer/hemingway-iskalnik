import test from "node:test";
import assert from "node:assert/strict";

const {
  shouldHideProductDescription,
  shouldShowFlightInfo,
} = await import("../lib/product-display.ts");

test("hides the product description for RIVA offers", () => {
  assert.equal(shouldHideProductDescription("RIVA"), true);
  assert.equal(shouldHideProductDescription("PALM"), false);
});

test("shows flight info for pauschal searches", () => {
  assert.equal(
    shouldShowFlightInfo({
      searchType: "pauschal",
    }),
    true
  );
});

test("shows flight info for flight-like products outside pauschal search", () => {
  assert.equal(
    shouldShowFlightInfo({
      searchType: "hotel",
      serviceTypes: { TO: true },
      roomTypes: { OU: true },
    }),
    true
  );
});

test("hides flight info for non-flight hotel and trip products", () => {
  assert.equal(
    shouldShowFlightInfo({
      searchType: "hotel",
      serviceTypes: { BB: true },
      roomTypes: { DB: true },
    }),
    false
  );
  assert.equal(
    shouldShowFlightInfo({
      searchType: "trips",
      serviceTypes: {},
      roomTypes: {},
    }),
    false
  );
});
