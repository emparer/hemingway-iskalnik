function readString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

export function getCheckoutReference(result: any) {
  return (
    readString(result?.Operator?.BookingCode) ||
    readString(result?.Operator?.RegistrationBookingCode) ||
    readString(result?.Operator?.RemoteBookingCode) ||
    readString(result?.RequestID) ||
    "success"
  );
}
