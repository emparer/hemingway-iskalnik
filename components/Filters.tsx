//components/Filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { normalizeFilterList } from "@/lib/filter-list";
import { sanitizeSearchParams } from "@/lib/query-params";

interface Props {
  data: any;
}

function filterList(filters: any, key: string) {
  return normalizeFilterList(filters?.[key]);
}

export default function Filters({ data }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startT] = useTransition();

  const filters = data?.Filters || {};
  const regions = filterList(filters, "Regions").length ? filterList(filters, "Regions") : filterList(filters, "Region");
  const cities = filterList(filters, "Cities").length ? filterList(filters, "Cities") : filterList(filters, "Location");

  const priceObj = data?.RFilters?.Price || {};
  const priceMin = Number(filters.PriceMin || priceObj.Minimum || priceObj.Min || 0);
  const priceMax = Number(filters.PriceMax || priceObj.Maximum || priceObj.Max || 3000);

  const [maxPrice, setMaxPrice] = useState(priceMax);
  const [showAllCities, setShowAllCities] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>({});
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  function snapshotSelectedFilters(params: typeof sp) {
    return {
      "Filter[Category][]": new Set(params.getAll("Filter[Category][]")),
      "Filter[ServiceType][]": new Set(params.getAll("Filter[ServiceType][]")),
      "Filter[RoomType][]": new Set(params.getAll("Filter[RoomType][]")),
      "Filter[Region][]": new Set(params.getAll("Filter[Region][]")),
      "Filter[Location][]": new Set(params.getAll("Filter[Location][]")),
    };
  }

  useEffect(() => {
    setMaxPrice(priceMax);
  }, [priceMax, sp]);

  useEffect(() => {
    setSelectedFilters(snapshotSelectedFilters(sp));
    setIsMobileFiltersOpen(false);
  }, [sp]);

  function pushFilter(key: string, value: string, checked: boolean) {
    const params = new URLSearchParams(sp.toString());
    const existing = params.getAll(key);
    if (checked) {
      if (!existing.includes(value)) params.append(key, value);
    } else {
      params.delete(key);
      existing.filter(v => v !== value).forEach(v => params.append(key, v));
    }
    params.set("Page", "0");
    sanitizeSearchParams(params);
    startT(() => router.push("?" + params.toString(), { scroll: false }));
  }

  function applyPriceRange() {
    const params = new URLSearchParams(sp.toString());
    params.set("RFilter[Price]", `${priceMin}, ${maxPrice}`);
    params.set("Page", "0");
    sanitizeSearchParams(params);
    router.push("?" + params.toString(), { scroll: false });
  }

  const serviceOptions = [
    { value: "TO", label: "Samo prevoz" },
    { value: "UF", label: "Nočitev z zajtrkom" },
    { value: "HP", label: "Polpenzion" },
    { value: "VP", label: "Polni penzion" },
    { value: "AI", label: "All inclusive" },
  ];

  const roomOptions = [
    { value: "OU", label: "Brez namestitve" },
    { value: "ST", label: "Studio" },
    { value: "AP", label: "Apartma" },
    { value: "DZ", label: "Dvoposteljna soba" },
    { value: "FZ", label: "Družinska soba" },
    { value: "SU", label: "Suita" },
    { value: "JS", label: "Junior suita" },
  ];

  const visibleCities = showAllCities ? cities : cities.slice(0, 8);
  const resetParams = new URLSearchParams(sp.toString());
  ["Filter[Category][]", "Filter[ServiceType][]", "Filter[RoomType][]", "Filter[Region][]", "Filter[Location][]", "RFilter[Price]", "ProductName"].forEach(key => resetParams.delete(key));

  function isChecked(key: string, value: string) {
    return selectedFilters[key]?.has(value) ?? false;
  }

  return (
    <>
      <button
        type="button"
        className="mobile-filter-fab"
        onClick={() => setIsMobileFiltersOpen(true)}
        aria-label="Odpri filtre"
      >
        <span className="mobile-filter-fab-icon">⚲</span>
        <span>Filtri</span>
      </button>

      <div
        className={`mobile-filter-backdrop${isMobileFiltersOpen ? " open" : ""}`}
        onClick={() => setIsMobileFiltersOpen(false)}
      />

      <aside className={`sidebar${isMobileFiltersOpen ? " mobile-open" : ""}`}>
      <div className="sidebar-header">
        <h3>Filtri</h3>
        <div className="sidebar-header-actions">
          <button
            type="button"
            className="btn-light"
            onClick={() => router.push(`?${resetParams.toString()}`, { scroll: false })}
            style={{ padding: "10px 14px", fontSize: 12 }}
          >
            Ponastavi
          </button>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setIsMobileFiltersOpen(false)}
            aria-label="Zapri filtre"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-title">Cena (€)</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
          <span>{priceMin} €</span>
          <span>{maxPrice} €</span>
        </div>
        <input
          type="range"
          min={priceMin}
          max={priceMax}
          step={50}
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          onMouseUp={applyPriceRange}
          onTouchEnd={applyPriceRange}
          style={{ width: "100%", accentColor: "var(--c)" }}
        />
      </div>

      <div className="filter-group">
        <div className="filter-title">Kategorija</div>
        {[5,4,3,2,1].map(n => (
          <label key={n} className="check">
            <input
              type="checkbox"
              checked={isChecked("Filter[Category][]", String(n))}
              onChange={e => pushFilter("Filter[Category][]", String(n), e.target.checked)}
            />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 2, marginRight: 6 }}>
              {Array.from({ length: n }).map((_, i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#eab308">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </span>
            {n} zvezdic{n === 1 ? "a" : n === 2 ? "i" : "e"}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <div className="filter-title">Storitev</div>
        {serviceOptions.map(o => (
          <label key={o.value} className="check">
            <input
              type="checkbox"
              checked={isChecked("Filter[ServiceType][]", o.value)}
              onChange={e => pushFilter("Filter[ServiceType][]", o.value, e.target.checked)}
            />
            {o.label}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <div className="filter-title">Tip sobe</div>
        {roomOptions.map(o => (
          <label key={o.value} className="check">
            <input
              type="checkbox"
              checked={isChecked("Filter[RoomType][]", o.value)}
              onChange={e => pushFilter("Filter[RoomType][]", o.value, e.target.checked)}
            />
            {o.label}
          </label>
        ))}
      </div>

      {regions.length > 0 && (
        <div className="filter-group">
          <div className="filter-title">Regija</div>
          {regions.map((r: any) => (
            <label key={r.ID || r.Value} className="check">
              <input
                type="checkbox"
                checked={isChecked("Filter[Region][]", String(r.ID || r.Value))}
                onChange={e => pushFilter("Filter[Region][]", String(r.ID || r.Value), e.target.checked)}
              />
              {r.Name || r.Label || r.Value}
            </label>
          ))}
        </div>
      )}

      {cities.length > 0 && (
        <div className="filter-group">
          <div className="filter-title">Mesto</div>
          {visibleCities.map((c: any) => (
            <label key={c.ID || c.Value} className="check">
              <input
                type="checkbox"
                checked={isChecked("Filter[Location][]", String(c.ID || c.Value))}
                onChange={e => pushFilter("Filter[Location][]", String(c.ID || c.Value), e.target.checked)}
              />
              {c.Name || c.Label || c.Value}
            </label>
          ))}
          {cities.length > 8 && (
            <button
              type="button"
              className="filter-more-btn"
              onClick={() => setShowAllCities(v => !v)}
            >
              {showAllCities ? "Prikaži manj" : `Prikaži več (${cities.length - 8})`}
            </button>
          )}
        </div>
      )}

      <div className="filter-group" style={{ borderBottom: "none", paddingBottom: 0 }}>
        <div className="filter-title">Ime hotela</div>
        <form
          onSubmit={e => {
            e.preventDefault();
            const val = (e.currentTarget.elements.namedItem("ProductName") as HTMLInputElement).value;
            const params = new URLSearchParams(sp.toString());
            if (val) params.set("ProductName", val);
            else params.delete("ProductName");
            params.set("Page", "0");
            router.push("?" + params.toString(), { scroll: false });
          }}
        >
          <input
            type="text"
            name="ProductName"
            defaultValue={sp.get("ProductName") || ""}
            placeholder="Iščite po imenu..."
            style={{ marginBottom: 8 }}
          />
          <button type="submit" className="btn" style={{ width: "100%", padding: 9 }}>
            Iskanje
          </button>
        </form>
      </div>
      </aside>
    </>
  );
}
