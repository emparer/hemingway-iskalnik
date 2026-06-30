function clampChildAge(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(17, Math.trunc(parsed)));
}

function normalizeChildAges(values: unknown[], childCount: number): number[] {
  const targetCount = Math.max(0, Math.min(4, Math.trunc(childCount)));
  const next = values.slice(0, targetCount).map(clampChildAge);
  while (next.length < targetCount) next.push(0);
  return next;
}

export function getChildAgesFromDefaults({
  defaultAges,
  adultCount,
  childCount,
}: {
  defaultAges: string;
  adultCount: number;
  childCount: number;
}) {
  const tokens = defaultAges
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);

  const normalizedChildCount = Math.max(0, Math.min(4, Math.trunc(childCount)));
  if (normalizedChildCount === 0) return [];
  const normalizedAdultCount = Math.max(0, Math.trunc(adultCount));

  const raw = tokens.map(part => Number(part));
  const firstChildIndex = raw.findIndex((age, index) => index >= normalizedAdultCount || (Number.isFinite(age) && age !== 30));
  const childOnly = firstChildIndex === -1
    ? []
    : raw
        .slice(firstChildIndex)
        .filter(age => Number.isFinite(age));

  return normalizeChildAges(childOnly, normalizedChildCount);
}

export function resizeChildAges(childAges: number[], childCount: number) {
  return normalizeChildAges(childAges, childCount);
}

export function serializeTravelerAges({
  adultCount,
  childCount,
  childAges,
}: {
  adultCount: number;
  childCount: number;
  childAges: number[];
}) {
  const normalizedChildCount = Math.max(0, Math.min(4, Math.trunc(childCount)));
  if (normalizedChildCount === 0) return "";

  const normalizedAdults = Math.max(1, Math.trunc(adultCount));
  const normalizedChildren = normalizeChildAges(childAges, normalizedChildCount);
  return [...Array(normalizedAdults).fill(30), ...normalizedChildren].join(",");
}
