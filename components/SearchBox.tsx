//components/SearchBox.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  defaultQuery?: string;
  defaultRegionGroup?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  defaultAdultCount?: number;
  type?: string;
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      type,
      query,
      RegionGroup: defaultRegionGroup,
      StartDate: startDate,
      EndDate: endDate,
      AdultCount: String(adultCount),
      ...(duration ? { Duration: duration } : {}),
    });
    router.push("/?" + params.toString());
  }

  return (
    <div className="search-summary">
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 16 }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14, flexWrap: "wrap" }}>
          <span>📍 {query}</span>
          <span>📅 {startDate} – {endDate}</span>
          <span>👤 {adultCount} odrasla</span>
        </div>
        <button
          type="button"
          className="btn-light"
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          style={{ fontSize: 13, padding: "7px 14px" }}
        >
          {expanded ? "Zapri ▲" : "Spremeni ▼"}
        </button>
      </div>

      {expanded && (
        <form onSubmit={handleSearch} style={{ marginTop: 16 }}>
          <div className="search-grid">
            <div className="sg-field">
              <label>Destinacija ali kraj</label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Vpišite destinacijo..."
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
                <option value="2-6">2–6 dni</option>
                <option value="7-9">7–9 dni</option>
                <option value="9-15">9–15 dni</option>
              </select>
            </div>
            <div className="sg-field">
              <label>Odrasli</label>
              <select value={adultCount} onChange={e => setAdultCount(Number(e.target.value))}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-search">🔍 Iskanje</button>
          </div>
        </form>
      )}
    </div>
  );
}
