import test from "node:test";
import assert from "node:assert/strict";

const { getCheckoutReference } = await import("../lib/checkout-reference.ts");

test("prefers booking code over request id", () => {
  const reference = getCheckoutReference({
    RequestID: "request-123",
    Operator: {
      BookingCode: 34961,
    },
  });

  assert.equal(reference, "34961");
});

test("falls back through other ORS identifiers", () => {
  assert.equal(
    getCheckoutReference({
      Operator: {
        RegistrationBookingCode: "REG-1",
      },
    }),
    "REG-1"
  );

  assert.equal(
    getCheckoutReference({
      Operator: {
        RemoteBookingCode: "REM-1",
      },
    }),
    "REM-1"
  );

  assert.equal(
    getCheckoutReference({
      RequestID: "request-456",
    }),
    "request-456"
  );
});

test("returns success when no identifier exists", () => {
  assert.equal(getCheckoutReference({}), "success");
});
