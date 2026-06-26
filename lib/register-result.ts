function readString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function readBookingCode(result: any) {
  return (
    readString(result?.Operator?.BookingCode) ||
    readString(result?.Operator?.RegistrationBookingCode) ||
    readString(result?.Operator?.RemoteBookingCode)
  );
}

export function assertSuccessfulRegistration(result: any) {
  if (readBookingCode(result)) {
    return result;
  }

  const statusText = readString(result?.StatusCode?.Text);
  const statusId = readString(result?.StatusCode?.ID);
  const fallbackMessage = "ORS did not create a reservation record.";
  const detail = [statusText, statusId ? `(${statusId})` : ""].filter(Boolean).join(" ");

  throw new Error(detail || fallbackMessage);
}
