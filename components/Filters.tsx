//components/Filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

interface Props {
  data: any;
}

function filterList(filters: any, key: string) {
  const raw = filters?.[key];

  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([id, v]: [string, any]) => ({
      ID: id,
      Name: v?.Value || v?.Name || v?.Label || String(v),
    }));
  }

  return [];
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
    startT(() => router.push("?" + params.toString()));
  }

  function applyPriceRange() {
    const params = new URLSearchParams(sp.toString());
    params.set("RFilter[Price]", `${priceMin}, ${maxPrice}`);
    params.set("Page", "0");
    router.push("?" + params.toString());
  }

  const serviceOptions = [
    { value: "AI", label: "All inclusive" },
    { value: "UF", label: "Nočitev z zajtrkom" },
    { value: "HP", label: "Polpenzion" },
    { value: "VP", label: "Polni penzion" },
    { value: "TO", label: "Samo prevoz" },
  ];

  const roomOptions = [
    { value: "DZ", label: "Dvoposteljna soba" },
    { value: "FZ", label: "Družinska soba" },
    { value: "SU", label: "Suita" },
    { value: "JS", label: "Junior suita" },
    { value: "OU", label: "Brez namestitve" },
  ];

  const visibleCities = showAllCities ? cities : cities.slice(0, 8);
  const resetParams = new URLSearchParams();

  ["type", "query", "RegionGroup", "StartDate", "EndDate", "AdultCount", "Duration"].forEach(key => {
    const value = sp.get(key);
    if (value) resetParams.set(key, value);
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Filtri</h3>
        <button
          type="button"
          className="btn-light"
          onClick={() => router.push(`?${resetParams.toString()}`)}
          style={{ padding: "10px 14px", fontSize: 12 }}
        >
          Ponastavi
        </button>
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
              defaultChecked={sp.getAll("Filter[Category][]").includes(String(n))}
              onChange={e => pushFilter("Filter[Category][]", String(n), e.target.checked)}
            />
            {"★".repeat(n)} {n} zvezdic{n === 1 ? "a" : n === 2 ? "i" : "e"}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <div className="filter-title">Storitev</div>
        {serviceOptions.map(o => (
          <label key={o.value} className="check">
            <input
              type="checkbox"
              defaultChecked={sp.getAll("Filter[ServiceType][]").includes(o.value)}
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
              defaultChecked={sp.getAll("Filter[RoomType][]").includes(o.value)}
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
                defaultChecked={sp.getAll("Filter[Region][]").includes(String(r.ID || r.Value))}
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
                defaultChecked={sp.getAll("Filter[Location][]").includes(String(c.ID || c.Value))}
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
            router.push("?" + params.toString());
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
  );
}
