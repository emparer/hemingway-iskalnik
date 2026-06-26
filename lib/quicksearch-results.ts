export function hasQuickSearchMatches(data: any) {
  const results = data?.Results || {};
  const locations = Array.isArray(results.Locations) ? results.Locations.length : 0;
  const regions = Array.isArray(results.Regions) ? results.Regions.length : 0;
  const products = Array.isArray(results.Products) ? results.Products.length : 0;

  return locations + regions + products > 0;
}

export function shouldFallbackToAnyQuickSearch(type: string, data: any) {
  return type !== "any" && type !== "hotel" && !hasQuickSearchMatches(data);
}
