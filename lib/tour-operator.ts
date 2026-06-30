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

const OPERATOR_PRIORITY = [
  "PALM",
  "SONH",
  "SONT",
  "ALPE",
  "NOMS",
  "OSK",
  "RIVA",
  "RLX",
  "ADRP",
  "ETI",
  "OASI",
  "ARS",
  "PALH",
];

function readString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function resolveGroupedOperator(operators: Record<string, unknown> | null | undefined) {
  const keys = Object.keys(operators || {}).map(readString).filter(Boolean);
  if (keys.length === 0) return "";

  for (const preferred of OPERATOR_PRIORITY) {
    if (keys.includes(preferred)) return preferred;
  }

  return keys[0] || "";
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

  const grouped = resolveGroupedOperator(matchingItem?.TourOperators);
  if (grouped) return grouped;

  const itemLevel = readString(matchingItem?.TourOperator);
  if (itemLevel) return itemLevel;

  const productLevel = readString(matchingItem?.Product?.TourOperator);
  if (productLevel) return productLevel;

  return "";
}
