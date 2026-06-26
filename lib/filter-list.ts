type FilterEntry = {
  ID: string;
  Name: string;
};

function readFilterLabel(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

function normalizeArrayEntry(entry: any): FilterEntry | null {
  const id = readFilterLabel(entry?.ID ?? entry?.Value ?? "");
  const name = readFilterLabel(entry?.Name ?? entry?.Label ?? entry?.Value ?? "");

  if (!id || !name) return null;
  return { ID: id, Name: name };
}

function normalizeObjectEntry(id: string, value: any): FilterEntry | null {
  const normalizedId = readFilterLabel(id);
  const name = readFilterLabel(value?.Value ?? value?.Name ?? value?.Label ?? "");

  if (!normalizedId || !name) return null;
  return { ID: normalizedId, Name: name };
}

export function normalizeFilterList(raw: any): FilterEntry[] {
  if (Array.isArray(raw)) {
    return raw
      .map(normalizeArrayEntry)
      .filter((entry): entry is FilterEntry => entry !== null);
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw)
      .map(([id, value]) => normalizeObjectEntry(id, value))
      .filter((entry): entry is FilterEntry => entry !== null);
  }

  return [];
}
