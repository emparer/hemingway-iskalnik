type OperatorSource = {
  TourOperator?: unknown;
  Product?: {
    TourOperator?: unknown;
  };
  TourOperators?: Record<string, unknown> | null;
};

type SearchParamSource = {
  TourOperator?: unknown;
};

function readString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function resolveTourOperator({
  searchParams,
  matchingItem,
}: {
  searchParams?: SearchParamSource | null;
  matchingItem?: OperatorSource | null;
}) {
  const explicit = readString(searchParams?.TourOperator);
  if (explicit) return explicit;

  const itemLevel = readString(matchingItem?.TourOperator);
  if (itemLevel) return itemLevel;

  const productLevel = readString(matchingItem?.Product?.TourOperator);
  if (productLevel) return productLevel;

  const grouped = Object.keys(matchingItem?.TourOperators || {})[0] || "";
  return readString(grouped);
}
