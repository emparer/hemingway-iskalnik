"use client";

import { useState } from "react";
import DateRow from "./DateRow";

interface DatesListProps {
  dates: any[];
  sp: Record<string, string>;
  adultCount: number;
}

type SortField = "date" | "duration" | "serviceType" | "roomStandard" | "roomType" | "price";
type SortOrder = "asc" | "desc" | null;

function parseSloDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split(".");
  if (parts.length === 3) {
    const d = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const y = Number(parts[2]);
    return new Date(y, m, d);
  }
  return new Date(dateStr);
}

export default function DatesList({ dates, sp, adultCount }: DatesListProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortOrder(null);
        setSortField(null);
      } else {
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedDates = [...dates].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;

    let valA: any = "";
    let valB: any = "";

    if (sortField === "date") {
      valA = parseSloDate(a.StartDate).getTime();
      valB = parseSloDate(b.StartDate).getTime();
    } else if (sortField === "duration") {
      valA = Number(a.Duration || 0);
      valB = Number(b.Duration || 0);
    } else if (sortField === "serviceType") {
      valA = String(a.ServiceName || a.ServiceCode || "").toLowerCase();
      valB = String(b.ServiceName || b.ServiceCode || "").toLowerCase();
    } else if (sortField === "roomStandard") {
      valA = String(a.RoomStandard || a.RoomStandardCode || "").toLowerCase();
      valB = String(b.RoomStandard || b.RoomStandardCode || "").toLowerCase();
    } else if (sortField === "roomType") {
      valA = String(a.RoomName || "").toLowerCase();
      valB = String(b.RoomName || "").toLowerCase();
    } else if (sortField === "price") {
      valA = Number(a.Price || 0);
      valB = Number(b.Price || 0);
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return "↕";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const getButtonClass = (field: SortField) => {
    return `sort-btn${sortField === field ? " active" : ""}`;
  };

  return (
    <div>
      <div className="sort-toolbar">
        <span className="sort-label">Razvrsti po:</span>
        <div className="sort-btn-group">
          <button className={getButtonClass("date")} onClick={() => handleSortToggle("date")}>
            Datum {getSortIcon("date")}
          </button>
          <button className={getButtonClass("duration")} onClick={() => handleSortToggle("duration")}>
            Trajanje {getSortIcon("duration")}
          </button>
          <button className={getButtonClass("serviceType")} onClick={() => handleSortToggle("serviceType")}>
            Storitev {getSortIcon("serviceType")}
          </button>
          <button className={getButtonClass("roomStandard")} onClick={() => handleSortToggle("roomStandard")}>
            Standard sobe {getSortIcon("roomStandard")}
          </button>
          <button className={getButtonClass("roomType")} onClick={() => handleSortToggle("roomType")}>
            Tip sobe {getSortIcon("roomType")}
          </button>
          <button className={getButtonClass("price")} onClick={() => handleSortToggle("price")}>
            Cena {getSortIcon("price")}
          </button>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div style={{ padding: "24px 4px", color: "var(--muted)", fontSize: 14 }}>
          Ni razpoložljivih terminov za izbrane filtre.
        </div>
      ) : (
        <div className="dates-grid">
          {sortedDates.map((d: any, i: number) => {
            const hashEnc = encodeURIComponent(d.HashCode || `mock:${i}:1`);
            const tourOpEnc = encodeURIComponent(d.TourOperator || sp.TourOperator || "PALM");
            const qs = new URLSearchParams({
              AdultCount: String(sp.AdultCount || 2),
              ...(sp.query ? { query: sp.query } : {}),
              ...(sp.RegionGroup ? { RegionGroup: sp.RegionGroup } : {}),
            }).toString();

            return (
              <DateRow
                key={i}
                d={d}
                tourOpEnc={tourOpEnc}
                hashEnc={hashEnc}
                qs={qs}
                adultCount={adultCount}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
