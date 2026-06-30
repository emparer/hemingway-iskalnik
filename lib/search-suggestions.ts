export interface QuickSearchLocation {
  LocationName?: string;
  LocationID?: number | string;
  RegionGroupID?: number | string;
  RegionGroupName?: string;
  RegionID?: number | string;
  RegionName?: string;
}

export interface QuickSearchRegion {
  RegionName?: string;
  RegionID?: number | string;
  RegionGroupID?: number | string;
  RegionGroupName?: string;
}

export type SearchSuggestion =
  | {
      kind: "region_group";
      label: string;
      sublabel: string;
      RegionGroup: string;
      Region?: string;
    }
  | {
      kind: "region";
      label: string;
      sublabel: string;
      RegionGroup: string;
      Region?: string;
    }
  | {
      kind: "location";
      label: string;
      sublabel: string;
      RegionGroup: string;
      Region?: string;
      Location?: string;
    };

function normalizeSearchValue(value?: string) {
  return (value || "")
    .trim()
    .toLocaleLowerCase("sl-SI")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function cleanCountryLabel(value: string) {
  return value.replace(/\s*\(otoki\)|\s*\(celina\)/gi, "").trim();
}

function getMatchingGroups(
  query: string,
  locations: QuickSearchLocation[],
  regions: QuickSearchRegion[]
) {
  const regionGroupsMap = new Map<string, { id: string; name: string }>();
  const collectGroup = (item: QuickSearchLocation | QuickSearchRegion) => {
    if (item.RegionGroupID && item.RegionGroupName) {
      regionGroupsMap.set(String(item.RegionGroupID), {
        id: String(item.RegionGroupID),
        name: item.RegionGroupName,
      });
    }
  };

  locations.forEach(collectGroup);
  regions.forEach(collectGroup);

  const normalizedQuery = normalizeSearchValue(query);
  return Array.from(regionGroupsMap.values())
    .filter(group => {
      const groupNorm = normalizeSearchValue(group.name);
      return groupNorm.includes(normalizedQuery) || normalizedQuery.includes(groupNorm);
    })
    .sort((a, b) => {
      const aDiff = Math.abs(normalizeSearchValue(a.name).length - normalizedQuery.length);
      const bDiff = Math.abs(normalizeSearchValue(b.name).length - normalizedQuery.length);
      return aDiff - bDiff;
    });
}

export function buildQuickSearchSuggestions({
  activeType,
  trimmedQuery,
  currentDefaultRegionGroup,
  locations,
  regions,
}: {
  activeType: string;
  trimmedQuery: string;
  currentDefaultRegionGroup: string;
  locations: QuickSearchLocation[];
  regions: QuickSearchRegion[];
}) {
  const matchingGroups = getMatchingGroups(trimmedQuery, locations, regions);
  const strictTripsCountryMode = activeType === "trips" && matchingGroups.length > 0;
  const primaryGroup = matchingGroups[0];

  const destinationSuggestions: SearchSuggestion[] = strictTripsCountryMode
    ? [{
        kind: "region_group",
        label: primaryGroup.name,
        sublabel: "Država / regijska skupina",
        RegionGroup: primaryGroup.id,
      }]
    : matchingGroups.map(group => ({
        kind: "region_group" as const,
        label: group.name,
        sublabel: "Država / regijska skupina",
        RegionGroup: group.id,
      }));

  const regionSource = strictTripsCountryMode
    ? regions.filter(item => String(item.RegionGroupID || "") === primaryGroup.id)
    : regions;

  const regionSuggestions: SearchSuggestion[] = regionSource.map(item => ({
    kind: "region" as const,
    label: item.RegionName || "Regija",
    sublabel: item.RegionGroupName || "",
    RegionGroup: String(item.RegionGroupID || currentDefaultRegionGroup),
    Region: item.RegionID ? String(item.RegionID) : undefined,
  }));

  let locationSuggestions: SearchSuggestion[] = [];
  if (strictTripsCountryMode) {
    locationSuggestions = [{
      kind: "location",
      label: cleanCountryLabel(primaryGroup.name),
      sublabel: "Država",
      RegionGroup: primaryGroup.id,
    }];
  } else if (matchingGroups.length > 0) {
    locationSuggestions = [{
      kind: "location",
      label: cleanCountryLabel(matchingGroups[0].name),
      sublabel: "Država",
      RegionGroup: matchingGroups[0].id,
    }];
  } else {
    locationSuggestions = locations.map(item => ({
      kind: "location" as const,
      label: item.LocationName || "Lokacija",
      sublabel: [item.RegionName, item.RegionGroupName].filter(Boolean).join(", "),
      RegionGroup: String(item.RegionGroupID || currentDefaultRegionGroup),
      Region: item.RegionID ? String(item.RegionID) : undefined,
      Location: item.LocationID ? String(item.LocationID) : undefined,
    }));
  }

  const dedupedSuggestions = [
    ...destinationSuggestions,
    ...locationSuggestions,
    ...regionSuggestions,
  ].filter((item, index, arr) => {
    const key = `${item.kind}:${item.label}:${item.sublabel}`;
    return arr.findIndex(candidate => `${candidate.kind}:${candidate.label}:${candidate.sublabel}` === key) === index;
  });

  return dedupedSuggestions.slice(0, 8);
}
