function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function shouldHideProductDescription(tourOperator: unknown) {
  return readString(tourOperator).toUpperCase() === "RIVA";
}

export function shouldShowFlightInfo({
  searchType,
  productType,
  serviceTypes,
  roomTypes,
}: {
  searchType?: unknown;
  productType?: unknown;
  serviceTypes?: Record<string, unknown> | null;
  roomTypes?: Record<string, unknown> | null;
}) {
  if (readString(searchType) === "pauschal") return true;
  if (readString(productType) === "pauschal") return true;

  const serviceKeys = Object.keys(serviceTypes || {});
  const roomKeys = Object.keys(roomTypes || {});

  return serviceKeys.length === 1 && serviceKeys[0] === "TO" && roomKeys.includes("OU");
}
