//components/SearchBox.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  defaultQuery?: string;
  defaultRegionGroup?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  defaultAdultCount?: number;
  type?: string;
  compact?: boolean;
}

interface QuickSearchLocation {
  LocationName?: string;
  LocationID?: number | string;
  RegionGroupID?: number | string;
  RegionGroupName?: string;
  RegionID?: number | string;
  RegionName?: string;
}

interface QuickSearchRegion {
  RegionName?: string;
  RegionID?: number | string;
  RegionGroupID?: number | string;
  RegionGroupName?: string;
}

interface QuickSearchProduct {
  ProductName?: string;
  ProductID?: number | string;
  Type?: string;
  Location?: QuickSearchLocation;
}

type SearchSuggestion =
  | {
      kind: "location";
      label: string;
      sublabel: string;
      RegionGroup: string;
      Region?: string;
      Location: string;
    }
  | {
      kind: "region";
      label: string;
      sublabel: string;
      RegionGroup: string;
      Region: string;
    };

function normalizeSearchValue(value?: string) {
  return (value || "")
    .trim()
    .toLocaleLowerCase("sl-SI")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default function SearchBox({
  defaultQuery = "Turčija",
  defaultRegionGroup = "724",
  defaultStartDate = "19.05.2026",
  defaultEndDate = "18.05.2027",
  defaultAdultCount = 2,
  type = "pauschal",
  compact = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultQuery);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [adultCount, setAdultCount] = useState(defaultAdultCount);
  const [duration, setDuration] = useState("");
  const [activeType, setActiveType] = useState(type);
  
  // New fields for specific types
  const [airport, setAirport] = useState("");
  const [minService, setMinService] = useState("");
  const [minCategory, setMinCategory] = useState("");
  const [subType, setSubType] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SearchSuggestion | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isQueryFocused, setIsQueryFocused] = useState(false);

  useEffect(() => {
    setQuery(defaultQuery);
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setAdultCount(defaultAdultCount);
    setActiveType(type);
  }, [defaultAdultCount, defaultEndDate, defaultQuery, defaultStartDate, type]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSuggesting(false);
      return;
    }

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

        const nextSuggestions: SearchSuggestion[] = [
          ...locations.map(item => ({
            kind: "location" as const,
            label: item.LocationName || "Lokacija",
            sublabel: [item.RegionName, item.RegionGroupName].filter(Boolean).join(", "),
            RegionGroup: String(item.RegionGroupID || defaultRegionGroup),
            Region: item.RegionID ? String(item.RegionID) : undefined,
            Location: String(item.LocationID),
          })),
          ...regions.map(item => ({
            kind: "region" as const,
            label: item.RegionName || "Regija",
            sublabel: item.RegionGroupName || "",
            RegionGroup: String(item.RegionGroupID || defaultRegionGroup),
            Region: String(item.RegionID),
          })),
        ];

        const dedupedSuggestions = nextSuggestions.filter((item, index, arr) => {
          const key = `${item.kind}:${item.label}:${item.sublabel}`;
          return arr.findIndex(candidate => `${candidate.kind}:${candidate.label}:${candidate.sublabel}` === key) === index;
        });

        setSuggestions(dedupedSuggestions.slice(0, 8));
        setShowSuggestions(isQueryFocused && dedupedSuggestions.length > 0);
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
  }, [activeType, defaultRegionGroup, isQueryFocused, query]);

  async function resolveSearchTarget() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return {
        query: trimmedQuery,
        RegionGroup: defaultRegionGroup,
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

      const exactLocation = locations.find(item => normalizeSearchValue(item.LocationName) === normalizedQuery);
      if (exactLocation?.LocationID) {
        return {
          query: trimmedQuery,
          RegionGroup: String(exactLocation.RegionGroupID || defaultRegionGroup),
          Region: exactLocation.RegionID ? String(exactLocation.RegionID) : undefined,
          Location: String(exactLocation.LocationID),
        };
      }

      const exactRegion = regions.find(item => normalizeSearchValue(item.RegionName) === normalizedQuery);
      if (exactRegion?.RegionID) {
        return {
          query: trimmedQuery,
          RegionGroup: String(exactRegion.RegionGroupID || defaultRegionGroup),
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

    return {
      query: trimmedQuery,
      RegionGroup: defaultRegionGroup,
    };
  }

  function getServiceCodes(min: string) {
    if (min === "OV") return ["OV", "BB", "HB", "FB", "AI"];
    if (min === "BB") return ["BB", "HB", "FB", "AI"];
    if (min === "HB") return ["HB", "FB", "AI"];
    if (min === "AI") return ["AI"];
    return [];
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const target = await resolveSearchTarget();
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
      "Duration",
      "DepartureAirports",
      "MinCategory",
      "SubType",
      "Page",
      "ServiceCodes[]",
    ].forEach(key => params.delete(key));

    params.set("type", activeType);
    params.set("query", target.query);
    params.set("RegionGroup", target.RegionGroup);
    params.set("StartDate", startDate);
    params.set("EndDate", endDate);
    params.set("AdultCount", String(adultCount));
    params.set("Page", "0");

    if (duration) params.set("Duration", duration);
    if (target.Region) params.set("Region", target.Region);
    if (target.Location) params.set("Location", target.Location);
    if (target.ProductName) params.set("ProductName", target.ProductName);
    if (target.GiataID) params.set("GiataID", target.GiataID);
    if (airport) params.set("DepartureAirports", airport);
    if (minCategory) params.set("MinCategory", minCategory);
    if (subType) params.set("SubType", subType);

    const codes = getServiceCodes(minService);
    codes.forEach(c => params.append("ServiceCodes[]", c));

    setShowSuggestions(false);
    router.push("/?" + params.toString());
  }

  const typeOptions = [
    { value: "pauschal", label: "Počitnice z letalom" },
    { value: "hotel", label: "Samo nastanitev" },
    { value: "trips", label: "Avtobusna potovanja" },
  ];

  return (
    <section className={`search-panel ${compact ? "compact" : ""}`}>
      <div className="search-type-tabs">
        {typeOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`search-type-tab ${activeType === opt.value ? "active" : ""}`}
            onClick={() => setActiveType(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* No summary when compact or empty */}


      <form onSubmit={handleSearch} className="search-form">
        <div className="search-grid">
          <div className="sg-field">
            <label>Destinacija ali kraj</label>
            <div className="search-autocomplete">
              <input
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
                  {suggestions.map(item => (
                    <button
                      key={`${item.kind}-${item.label}-${item.sublabel}`}
                      type="button"
                      className="search-suggestion"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setQuery(item.label);
                        setSelectedSuggestion(item);
                        setShowSuggestions(false);
                      }}
                    >
                      <span className="search-suggestion-main">
                        {item.label}
                        <span className="search-suggestion-kind">
                          {item.kind === "location" ? "Destinacija" : "Regija"}
                        </span>
                      </span>
                      {item.sublabel && <span className="search-suggestion-sub">{item.sublabel}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="sg-field">
            <label>Najzgodnejši odhod</label>
            <input
              type="text"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              placeholder="DD.MM.LLLL"
            />
          </div>
          <div className="sg-field">
            <label>Najkasnejši povratek</label>
            <input
              type="text"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              placeholder="DD.MM.LLLL"
            />
          </div>
          <div className="sg-field">
            <label>Trajanje</label>
            <select value={duration} onChange={e => setDuration(e.target.value)}>
              <option value="">Izberite</option>
              <option value="2-6">2-6 dni</option>
              <option value="7-9">7-9 dni</option>
              <option value="9-15">9-15 dni</option>
            </select>
          </div>

          {activeType === "pauschal" && (
            <div className="sg-field">
              <label>Letališče</label>
              <select value={airport} onChange={e => setAirport(e.target.value)}>
                <option value="">Vsa letališča</option>
                <option value="LJU">Ljubljana (LJU)</option>
                <option value="VIE">Dunaj (VIE)</option>
                <option value="VCE">Benetke (VCE)</option>
                <option value="GRZ">Gradec (GRZ)</option>
                <option value="MUC">München (MUC)</option>
                <option value="ZAG">Zagreb (ZAG)</option>
              </select>
            </div>
          )}

          <div className="sg-field">
            <label>Odrasli</label>
            <select value={adultCount} onChange={e => setAdultCount(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {(activeType === "pauschal" || activeType === "hotel") && (
            <>
              <div className="sg-field">
                <label>Tip namestitve</label>
                <select value={minService} onChange={e => setMinService(e.target.value)}>
                  <option value="">Vseeno</option>
                  <option value="OV">Vsaj nočitev</option>
                  <option value="BB">Vsaj nočitev z zajtrkom</option>
                  <option value="HB">Vsaj polpenzion</option>
                  <option value="AI">Vse vključeno</option>
                </select>
              </div>
              <div className="sg-field">
                <label>Kategorija hotela</label>
                <select value={minCategory} onChange={e => setMinCategory(e.target.value)}>
                  <option value="">Vseeno</option>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}* ali več</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {activeType === "trips" && (
            <div className="sg-field">
              <label>Tip potovanja</label>
              <select value={subType} onChange={e => setSubType(e.target.value)}>
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
