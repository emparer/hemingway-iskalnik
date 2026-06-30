//components/SearchBox.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { buildFallbackSearchTarget, type ResolvedSearchTarget } from "@/lib/search-target";
import { getMinimumServiceCodes } from "@/lib/service-codes";
import { sanitizeSearchParams } from "@/lib/query-params";
import {
  getChildAgesFromDefaults,
  resizeChildAges,
  serializeTravelerAges,
} from "@/lib/child-ages";
import {
  buildQuickSearchSuggestions,
  type QuickSearchLocation,
  type QuickSearchRegion,
  type SearchSuggestion,
} from "@/lib/search-suggestions";

interface Props {
  defaultQuery?: string;
  defaultRegionGroup?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  defaultAdultCount?: number;
  defaultChildCount?: number;
  defaultAges?: string;
  defaultDepartureAirports?: string;
  type?: string;
  compact?: boolean;
  submitMode?: "internal" | "external";
  externalBaseUrl?: string;
  defaultDuration?: string;
  defaultMinService?: string;
  defaultMinCategory?: string;
  defaultSubType?: string;
  variant?: "default" | "embed-minimal";
}

interface QuickSearchProduct {
  ProductName?: string;
  ProductID?: number | string;
  Type?: string;
  Location?: QuickSearchLocation;
}

function normalizeSearchValue(value?: string) {
  return (value || "")
    .trim()
    .toLocaleLowerCase("sl-SI")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function SlovenianToIsoDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split(".");
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return "";
}

function IsoToSlovenianDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}.${month}.${year}`;
  }
  return "";
}

export default function SearchBox({
  defaultQuery = "",
  defaultRegionGroup = "",
  defaultStartDate = "",
  defaultEndDate = "",
  defaultAdultCount = 2,
  defaultChildCount = 0,
  defaultAges = "",
  defaultDepartureAirports = "",
  type = "pauschal",
  compact = false,
  submitMode = "internal",
  externalBaseUrl = "",
  defaultDuration = "",
  defaultMinService = "",
  defaultMinCategory = "",
  defaultSubType = "",
  variant = "default",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultQuery);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [adultCount, setAdultCount] = useState(defaultAdultCount);
  const [childCount, setChildCount] = useState(defaultChildCount);
  const [childAges, setChildAges] = useState(() =>
    getChildAgesFromDefaults({
      defaultAges,
      adultCount: defaultAdultCount,
      childCount: defaultChildCount,
    })
  );
  const [duration, setDuration] = useState(defaultDuration);
  const [activeType, setActiveType] = useState(type);
  
  // New fields for specific types
  const [airport, setAirport] = useState(defaultDepartureAirports);
  const [minService, setMinService] = useState(defaultMinService);
  const [minCategory, setMinCategory] = useState(defaultMinCategory);
  const [subType, setSubType] = useState(defaultSubType);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SearchSuggestion | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isQueryFocused, setIsQueryFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(true);
  const isEmbedMinimal = variant === "embed-minimal";

  const ignoreNextQueryEffectRef = useRef(false);

  useEffect(() => {
    setQuery(defaultQuery);
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setAdultCount(defaultAdultCount);
    setChildCount(defaultChildCount);
    setChildAges(
      getChildAgesFromDefaults({
        defaultAges,
        adultCount: defaultAdultCount,
        childCount: defaultChildCount,
      })
    );
    setAirport(defaultDepartureAirports);
    setActiveType(type);
    setDuration(defaultDuration);
    setMinService(defaultMinService);
    setMinCategory(defaultMinCategory);
    setSubType(defaultSubType);
  }, [
    defaultAdultCount,
    defaultChildCount,
    defaultAges,
    defaultEndDate,
    defaultQuery,
    defaultStartDate,
    defaultDepartureAirports,
    type,
    defaultDuration,
    defaultMinService,
    defaultMinCategory,
    defaultSubType
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 760px)");

    const syncMobileState = (matches: boolean) => {
      setIsMobileSearchOpen(!matches);
    };

    syncMobileState(media.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      syncMobileState(event.matches);
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (ignoreNextQueryEffectRef.current) {
      ignoreNextQueryEffectRef.current = false;
      return;
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSuggesting(false);
      return;
    }

    const currentDefaultRegionGroup = defaultRegionGroup;

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const res = await fetch(
          `/api/ors/quicksearch?type=${encodeURIComponent(activeType)}&query=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        const results = data?.Results || {};
        const locations: QuickSearchLocation[] = results.Locations || [];
        const regions: QuickSearchRegion[] = results.Regions || [];

        const nextSuggestions = buildQuickSearchSuggestions({
          activeType,
          trimmedQuery,
          currentDefaultRegionGroup,
          locations,
          regions,
        });

        setSuggestions(nextSuggestions);
        setShowSuggestions(isQueryFocused && nextSuggestions.length > 0);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setIsSuggesting(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [activeType, isQueryFocused, query, selectedSuggestion]);

  function handleChildCountChange(nextCount: number) {
    setChildCount(nextCount);
    setChildAges(current => resizeChildAges(current, nextCount));
  }

  function handleChildAgeChange(index: number, value: string) {
    setChildAges(current => {
      const next = resizeChildAges(current, childCount);
      next[index] = value === "" ? 0 : Number(value);
      return resizeChildAges(next, childCount);
    });
  }

  async function resolveSearchTarget(): Promise<ResolvedSearchTarget> {
    const trimmedQuery = query.trim();
    const currentDefaultRegionGroup = defaultRegionGroup;

    if (!trimmedQuery) {
      return {
        query: trimmedQuery,
        RegionGroup: currentDefaultRegionGroup,
      };
    }

    if (selectedSuggestion && normalizeSearchValue(selectedSuggestion.label) === normalizeSearchValue(trimmedQuery)) {
      if (selectedSuggestion.kind === "location") {
        return {
          query: selectedSuggestion.label,
          RegionGroup: selectedSuggestion.RegionGroup,
          Region: selectedSuggestion.Region,
          Location: selectedSuggestion.Location,
        };
      }

      return {
        query: selectedSuggestion.label,
        RegionGroup: selectedSuggestion.RegionGroup,
        Region: selectedSuggestion.Region,
      };
    }

    try {
      const res = await fetch(`/api/ors/quicksearch?type=${encodeURIComponent(activeType)}&query=${encodeURIComponent(trimmedQuery)}`);
      const data = await res.json();
      const results = data?.Results || {};
      const locations: QuickSearchLocation[] = results.Locations || [];
      const regions: QuickSearchRegion[] = results.Regions || [];
      const products: QuickSearchProduct[] = results.Products || [];
      const normalizedQuery = normalizeSearchValue(trimmedQuery);

      // Check if query matches a RegionGroup name (e.g. Grčija)
      const regionGroupsMap = new Map<string, { id: string; name: string }>();
      const collectGroup = (item: any) => {
        if (item.RegionGroupID && item.RegionGroupName) {
          regionGroupsMap.set(String(item.RegionGroupID), {
            id: String(item.RegionGroupID),
            name: item.RegionGroupName,
          });
        }
      };
      locations.forEach(collectGroup);
      regions.forEach(collectGroup);

      const matchingGroups = Array.from(regionGroupsMap.values()).filter(group => {
        const groupNorm = normalizeSearchValue(group.name);
        return groupNorm.includes(normalizedQuery) || normalizedQuery.includes(groupNorm);
      });

      if (matchingGroups.length > 0) {
        matchingGroups.sort((a, b) => {
          const aNorm = normalizeSearchValue(a.name);
          const bNorm = normalizeSearchValue(b.name);
          const aDiff = Math.abs(aNorm.length - normalizedQuery.length);
          const bDiff = Math.abs(bNorm.length - normalizedQuery.length);
          return aDiff - bDiff;
        });

        return {
          query: matchingGroups[0].name,
          RegionGroup: matchingGroups[0].id,
        };
      }

      const exactLocation = locations.find(item => normalizeSearchValue(item.LocationName) === normalizedQuery);
      if (exactLocation?.LocationID) {
        return {
          query: trimmedQuery,
          RegionGroup: String(exactLocation.RegionGroupID || currentDefaultRegionGroup),
          Region: exactLocation.RegionID ? String(exactLocation.RegionID) : undefined,
          Location: String(exactLocation.LocationID),
        };
      }

      const exactRegion = regions.find(item => normalizeSearchValue(item.RegionName) === normalizedQuery);
      if (exactRegion?.RegionID) {
        return {
          query: trimmedQuery,
          RegionGroup: String(exactRegion.RegionGroupID || currentDefaultRegionGroup),
          Region: String(exactRegion.RegionID),
        };
      }

      const exactProduct = products.find(item => normalizeSearchValue(item.ProductName) === normalizedQuery);
      if (exactProduct?.Location?.RegionGroupID) {
        return {
          query: trimmedQuery,
          RegionGroup: String(exactProduct.Location.RegionGroupID),
          Region: exactProduct.Location.RegionID ? String(exactProduct.Location.RegionID) : undefined,
          Location: exactProduct.Location.LocationID ? String(exactProduct.Location.LocationID) : undefined,
          ProductName: exactProduct.ProductName || trimmedQuery,
          GiataID: exactProduct.ProductID ? String(exactProduct.ProductID) : undefined,
        };
      }

      const inferredRegionGroup =
        locations[0]?.RegionGroupID ||
        regions[0]?.RegionGroupID ||
        products[0]?.Location?.RegionGroupID;

      if (inferredRegionGroup) {
        return {
          query: trimmedQuery,
          RegionGroup: String(inferredRegionGroup),
        };
      }
    } catch {
      // Fall back to the manually entered query if quicksearch fails.
    }

    return buildFallbackSearchTarget(trimmedQuery, currentDefaultRegionGroup);
  }

  function buildSearchParams(target: Awaited<ReturnType<typeof resolveSearchTarget>>) {
    const params = new URLSearchParams(searchParams.toString());

    [
      "type",
      "query",
      "RegionGroup",
      "Region",
      "Location",
      "ProductName",
      "GiataID",
      "StartDate",
      "EndDate",
      "AdultCount",
      "ChildCount",
      "Ages",
      "Duration",
      "DepartureAirports",
      "MinCategory",
      "SubType",
      "Page",
      "ServiceCodes[]",
      "TourOperator",
      "Filter[Category][]",
      "Filter[ServiceType][]",
      "Filter[RoomType][]",
      "Filter[Region][]",
      "Filter[Location][]",
      "RFilter[Price]",
    ].forEach(key => params.delete(key));

    // Resolve search type based on destination/query
    params.set("type", activeType);
    params.set("query", target.query);
    params.set("RegionGroup", target.RegionGroup);
    params.set("StartDate", startDate);
    params.set("EndDate", endDate);
    params.set("AdultCount", String(adultCount));
    if (childCount > 0) {
      params.set("ChildCount", String(childCount));
      params.set(
        "Ages",
        serializeTravelerAges({
          adultCount,
          childCount,
          childAges,
        })
      );
    }
    params.set("Page", "0");

    if (duration) params.set("Duration", duration);
    if (target.Region) params.set("Region", target.Region);
    if (target.Location) params.set("Location", target.Location);
    if (target.ProductName) params.set("ProductName", target.ProductName);
    if (target.GiataID) params.set("GiataID", target.GiataID);
    if (airport) params.set("DepartureAirports", airport);
    if (minCategory) params.set("MinCategory", minCategory);
    if (subType) params.set("SubType", subType);

    const codes = getMinimumServiceCodes(minService);
    codes.forEach(c => params.append("ServiceCodes[]", c));

    return sanitizeSearchParams(params);
  }

  function buildSearchUrl(target: Awaited<ReturnType<typeof resolveSearchTarget>>) {
    const params = buildSearchParams(target);
    const fallbackBase = typeof window !== "undefined" ? window.location.origin : "";
    const base = (externalBaseUrl || fallbackBase).replace(/\/$/, "");
    return `${base}/?${params.toString()}`;
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const popup = submitMode === "external" && typeof window !== "undefined"
      ? window.open("about:blank", "_blank")
      : null;
    const target = await resolveSearchTarget();
    const url = buildSearchUrl(target);

    setShowSuggestions(false);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches) {
      setIsMobileSearchOpen(false);
    }

    if (submitMode === "external") {
      if (popup) {
        popup.opener = null;
        popup.location.href = url;
      } else {
        window.location.href = url;
      }
      return;
    }

    router.push("/?" + buildSearchParams(target).toString());
  }

  const typeOptions = [
    { value: "pauschal", label: "Počitnice z letalom" },
    { value: "hotel", label: "Samo nastanitev" },
    { value: "trips", label: "Potovanja" },
  ];

  return (
    <section className={`search-panel ${compact ? "compact" : ""}${isEmbedMinimal ? " embed-minimal" : ""}`}>
      {!isEmbedMinimal && (
        <div className="search-type-tabs">
          {typeOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`search-type-tab ${activeType === opt.value ? "active" : ""}`}
              onClick={() => {
                setActiveType(opt.value);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {!isEmbedMinimal && (
        <button
          type="button"
          className="search-mobile-toggle"
          onClick={() => setIsMobileSearchOpen(current => !current)}
          aria-expanded={isMobileSearchOpen}
        >
          <span>{isMobileSearchOpen ? "Skrij iskalnik" : "Prikaži iskalnik"}</span>
          <span className={`search-mobile-toggle-icon${isMobileSearchOpen ? " open" : ""}`}>⌄</span>
        </button>
      )}

      <form onSubmit={handleSearch} className={`search-form${isMobileSearchOpen ? "" : " mobile-collapsed"}`}>
        <div className="search-grid">
          {isEmbedMinimal && (
            <div className="sg-field sg-field-type">
              <label>Tip ponudbe</label>
              <select
                className="sg-control sg-select"
                value={activeType}
                onChange={e => setActiveType(e.target.value)}
              >
                {typeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="sg-field sg-field-destination">
            <label>Destinacija ali kraj</label>
            <div className="search-autocomplete">
              <input
                className="sg-control"
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedSuggestion(null);
                }}
                onFocus={() => {
                  setIsQueryFocused(true);
                  if (query.trim().length >= 3 && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setIsQueryFocused(false);
                    setShowSuggestions(false);
                  }, 120);
                }}
                placeholder="Vpišite destinacijo"
                autoComplete="off"
              />
              {showSuggestions && (suggestions.length > 0 || isSuggesting) && (
                <div className="search-suggestions">
                  {isSuggesting && suggestions.length === 0 && (
                    <div className="search-suggestion-empty">Iščem destinacije in regije ...</div>
                  )}
                  {(() => {
                    const destinacije = suggestions.filter(s => s.kind === "region_group");
                    const regije = suggestions.filter(s => s.kind === "region");
                    const kraji = suggestions.filter(s => s.kind === "location");

                    const renderItem = (item: SearchSuggestion) => (
                      <button
                        key={`${item.kind}-${item.label}-${item.sublabel}`}
                        type="button"
                        className="search-suggestion"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setQuery(item.label);
                          setSelectedSuggestion(item);
                          setShowSuggestions(false);
                          ignoreNextQueryEffectRef.current = true;
                        }}
                      >
                        <span className="search-suggestion-main">{item.label}</span>
                        {item.sublabel && <span className="search-suggestion-sub">{item.sublabel}</span>}
                      </button>
                    );

                    return (
                      <>
                        {destinacije.length > 0 && (
                          <div className="search-suggestion-group">
                            <div className="search-suggestion-group-title">Destinacije</div>
                            {destinacije.map(renderItem)}
                          </div>
                        )}
                        {regije.length > 0 && (
                          <div className="search-suggestion-group">
                            <div className="search-suggestion-group-title">Regije</div>
                            {regije.map(renderItem)}
                          </div>
                        )}
                        {kraji.length > 0 && (
                          <div className="search-suggestion-group">
                            <div className="search-suggestion-group-title">Kraji</div>
                            {kraji.map(renderItem)}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
          <div className="sg-field sg-field-start-date">
            <label>Odhod od</label>
            <input
              className="sg-control"
              type="date"
              value={SlovenianToIsoDate(startDate)}
              onChange={e => setStartDate(IsoToSlovenianDate(e.target.value))}
            />
          </div>
          <div className="sg-field sg-field-end-date">
            <label>Prihod do</label>
            <input
              className="sg-control"
              type="date"
              value={SlovenianToIsoDate(endDate)}
              onChange={e => setEndDate(IsoToSlovenianDate(e.target.value))}
            />
          </div>
          {!isEmbedMinimal && (
            <div className="sg-field sg-field-duration">
              <label>Trajanje</label>
              <select className="sg-control sg-select" value={duration} onChange={e => setDuration(e.target.value)}>
                <option value="">Izberite</option>
                <option value="2-6">2-6 dni</option>
                <option value="7-9">7-9 dni</option>
                <option value="9-15">9-15 dni</option>
                <option value="15-99">Več kot 15 dni</option>
              </select>
            </div>
          )}

          {!isEmbedMinimal && activeType === "pauschal" && (
            <div className="sg-field sg-field-airport">
              <label>Letališče</label>
              <select className="sg-control sg-select" value={airport} onChange={e => setAirport(e.target.value)}>
                <option value="">Vsa letališča</option>
                <option value="MUC">München (MUC)</option>
                <option value="VIE">Dunaj (VIE)</option>
                <option value="SZG">Salzburg (SZG)</option>
                <option value="GRZ">Gradec (GRZ)</option>
                <option value="LJU">Ljubljana (LJU)</option>
              </select>
            </div>
          )}

          {!isEmbedMinimal && (
            <div className="sg-field sg-field-adults">
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", marginBottom: "4px", color: "var(--muted)" }}>Odrasli</label>
                  <select className="sg-control sg-select" value={adultCount} onChange={e => setAdultCount(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", marginBottom: "4px", color: "var(--muted)" }}>Otroci</label>
                  <select className="sg-control sg-select" value={childCount} onChange={e => handleChildCountChange(Number(e.target.value))}>
                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {!isEmbedMinimal && childCount > 0 && (
            <div className="sg-field sg-field-child-age">
              <label>Starost otrok</label>
              <div style={{ display: "grid", gap: "8px" }}>
                {Array.from({ length: childCount }, (_, index) => (
                  <div key={index} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", color: "var(--muted)" }}>
                      {`Otrok ${index + 1}`}
                    </label>
                    <input
                      className="sg-control"
                      type="number"
                      min={0}
                      max={17}
                      value={childAges[index] ?? 0}
                      onChange={e => handleChildAgeChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isEmbedMinimal && (activeType === "pauschal" || activeType === "hotel") && (
            <>
              <div className="sg-field sg-field-service">
                <label>Storitev</label>
                <select className="sg-control sg-select" value={minService} onChange={e => setMinService(e.target.value)}>
                  <option value="">Vseeno</option>
                  <option value="OV">Vsaj nočitev</option>
                  <option value="BB">Vsaj nočitev z zajtrkom</option>
                  <option value="HB">Vsaj polpenzion</option>
                  <option value="AI">All inclusive</option>
                </select>
              </div>
              <div className="sg-field sg-field-category">
                <label>Kategorija hotela</label>
                <select className="sg-control sg-select" value={minCategory} onChange={e => setMinCategory(e.target.value)}>
                  <option value="">Vseeno</option>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}* ali več</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {!isEmbedMinimal && activeType === "trips" && (
            <div className="sg-field sg-field-subtype">
              <label>Tip potovanja</label>
              <select className="sg-control sg-select" value={subType} onChange={e => setSubType(e.target.value)}>
                <option value="">Vseeno</option>
                <option value="avtobus+letalo">avtobus + letalo</option>
                <option value="avtobus+letalo+ladja">avtobus + letalo + ladja</option>
                <option value="catalog">katalog</option>
                <option value="cruise">križarjenje</option>
                <option value="brez-transferja">brez transferja</option>
                <option value="paket">paket</option>
                <option value="plane">letalo</option>
                <option value="train">vlak</option>
                <option value="trip">potovanje</option>
                <option value="kombi">kombi</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-search">Išči ponudbe</button>
        </div>
      </form>
    </section>
  );
}
