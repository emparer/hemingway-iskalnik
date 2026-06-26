export type ResolvedSearchTarget = {
  query: string;
  RegionGroup: string;
  Region?: string;
  Location?: string;
  ProductName?: string;
  GiataID?: string;
};

export function buildFallbackSearchTarget(query: string, defaultRegionGroup: string): ResolvedSearchTarget {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return {
      query: trimmedQuery,
      RegionGroup: defaultRegionGroup,
    };
  }

  if (defaultRegionGroup) {
    return {
      query: trimmedQuery,
      RegionGroup: defaultRegionGroup,
    };
  }

  return {
    query: trimmedQuery,
    RegionGroup: defaultRegionGroup,
    ProductName: trimmedQuery,
  };
}
