import test from "node:test";
import assert from "node:assert/strict";

const { assertSuccessfulRegistration } = await import("../lib/register-result.ts");

test("accepts ORS registration responses with a booking code", () => {
  assert.doesNotThrow(() => {
    assertSuccessfulRegistration({
      StatusCode: { Status: 2, Text: "Rezervacija na vprašanje" },
      Operator: { BookingCode: 34962 },
    });
  });
});

test("rejects ORS 200 responses without a booking code", () => {
  assert.throws(
    () =>
      assertSuccessfulRegistration({
        StatusCode: { Status: 3, ID: 510, Text: "Zasedeno" },
        Operator: { TourOperator: "PALM" },
      }),
    /Zasedeno/
  );
});
