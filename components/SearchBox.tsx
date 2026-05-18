//components/SearchBox.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  defaultQuery?: string;
  defaultRegionGroup?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  defaultAdultCount?: number;
  type?: string;
}

interface QuickSearchLocation {
  LocationName?: string;
  LocationID?: number | string;
  RegionGroupID?: number | string;
  RegionID?: number | string;
}

interface QuickSearchRegion {
  RegionName?: string;
  RegionID?: number | string;
  RegionGroupID?: number | string;
}

interface QuickSearchProduct {
  ProductName?: string;
  ProductID?: number | string;
  Type?: string;
  Location?: QuickSearchLocation;
}

export default function SearchBox({
  defaultQuery = "Turčija",
  defaultRegionGroup = "724",
  defaultStartDate = "19.05.2026",
  defaultEndDate = "18.05.2027",
  defaultAdultCount = 2,
  type = "pauschal",
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [adultCount, setAdultCount] = useState(defaultAdultCount);
  const [duration, setDuration] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setQuery(defaultQuery);
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setAdultCount(defaultAdultCount);
  }, [defaultAdultCount, defaultEndDate, defaultQuery, defaultStartDate]);

  async function resolveSearchTarget() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return {
        query: trimmedQuery,
        RegionGroup: defaultRegionGroup,
      };
    }

    try {
      const res = await fetch(`/api/ors/quicksearch?type=${encodeURIComponent(type)}&query=${encodeURIComponent(trimmedQuery)}`);
      const data = await res.json();
      const results = data?.Results || {};
      const locations: QuickSearchLocation[] = results.Locations || [];
      const regions: QuickSearchRegion[] = results.Regions || [];
      const products: QuickSearchProduct[] = results.Products || [];
      const lowerQuery = trimmedQuery.toLocaleLowerCase("sl-SI");

      const exactLocation = locations.find(item => item.LocationName?.toLocaleLowerCase("sl-SI") === lowerQuery);
      if (exactLocation?.LocationID) {
        return {
          query: trimmedQuery,
          RegionGroup: String(exactLocation.RegionGroupID || defaultRegionGroup),
          Region: exactLocation.RegionID ? String(exactLocation.RegionID) : undefined,
          Location: String(exactLocation.LocationID),
        };
      }

      const exactRegion = regions.find(item => item.RegionName?.toLocaleLowerCase("sl-SI") === lowerQuery);
      if (exactRegion?.RegionID) {
        return {
          query: trimmedQuery,
          RegionGroup: String(exactRegion.RegionGroupID || defaultRegionGroup),
          Region: String(exactRegion.RegionID),
        };
      }

      const firstLocation = locations[0];
      if (firstLocation?.LocationID) {
        return {
          query: trimmedQuery,
          RegionGroup: String(firstLocation.RegionGroupID || defaultRegionGroup),
          Region: firstLocation.RegionID ? String(firstLocation.RegionID) : undefined,
          Location: String(firstLocation.LocationID),
        };
      }

      const firstRegion = regions[0];
      if (firstRegion?.RegionID) {
        return {
          query: trimmedQuery,
          RegionGroup: String(firstRegion.RegionGroupID || defaultRegionGroup),
          Region: String(firstRegion.RegionID),
        };
      }

      const firstProduct = products[0];
      if (firstProduct?.Location?.RegionGroupID) {
        return {
          query: trimmedQuery,
          RegionGroup: String(firstProduct.Location.RegionGroupID),
          Region: firstProduct.Location.RegionID ? String(firstProduct.Location.RegionID) : undefined,
          Location: firstProduct.Location.LocationID ? String(firstProduct.Location.LocationID) : undefined,
          ProductName: trimmedQuery,
          GiataID: firstProduct.ProductID ? String(firstProduct.ProductID) : undefined,
        };
      }
    } catch {
      // Fall back to the manually entered query if quicksearch fails.
    }

    return {
      query: trimmedQuery,
      RegionGroup: defaultRegionGroup,
      ProductName: trimmedQuery,
    };
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const target = await resolveSearchTarget();
    const params = new URLSearchParams({
      type,
      query: target.query,
      RegionGroup: target.RegionGroup,
      StartDate: startDate,
      EndDate: endDate,
      AdultCount: String(adultCount),
      ...(duration ? { Duration: duration } : {}),
      ...(target.Region ? { Region: target.Region } : {}),
      ...(target.Location ? { Location: target.Location } : {}),
      ...(target.ProductName ? { ProductName: target.ProductName } : {}),
      ...(target.GiataID ? { GiataID: target.GiataID } : {}),
    });
    router.push("/?" + params.toString());
  }

  return (
    <section className="search-panel">
      <div className="search-summary">
        <div className="search-intro">
          <div className="eyebrow">Curated travel offers</div>
          <h1 className="search-title">Poiščite let, hotel ali potovanje v enem toku.</h1>
          <p className="search-copy">
            Zasnova je usmerjena v hitro primerjavo ponudb, jasne cene in gladek prehod od iskanja do rezervacije.
          </p>
          <div className="search-highlights">
            <div className="search-highlight">
              <span className="search-highlight-label">Destinacija</span>
              <span className="search-highlight-value">{query}</span>
            </div>
            <div className="search-highlight">
              <span className="search-highlight-label">Termin</span>
              <span className="search-highlight-value">{startDate} - {endDate}</span>
            </div>
            <div className="search-highlight">
              <span className="search-highlight-label">Potniki</span>
              <span className="search-highlight-value">{adultCount} odrasli</span>
            </div>
          </div>
        </div>

        <div className="search-toggle">
          <button
            type="button"
            className="btn-light"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? "Zapri iskanje" : "Prilagodi iskanje"}
          </button>
        </div>
      </div>

      {expanded ? (
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-grid">
            <div className="sg-field">
              <label>Destinacija ali kraj</label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Vpišite destinacijo"
              />
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
            <div className="sg-field">
              <label>Odrasli</label>
              <select value={adultCount} onChange={e => setAdultCount(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-search">Išči ponudbe</button>
          </div>
        </form>
      ) : (
        <div className="search-closed-note">
          <span className="search-highlight">Letalske ponudbe, hoteli in avtobusna potovanja na istem mestu.</span>
        </div>
      )}
    </section>
  );
}
