"use client";

import { useState, useEffect } from "react";
import DateRow from "./DateRow";

interface DatesListProps {
  dates: any[];
  sp: any;
  adultCount: number;
  childCount?: number;
  ages?: string;
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

export default function DatesList({ dates, sp, adultCount, childCount = 0, ages = "" }: DatesListProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const PAGE_SIZE = 10;

  // Reset page when dates change
  useEffect(() => {
    setCurrentPage(0);
  }, [dates]);

  const handleSortToggle = (field: SortField) => {
    setCurrentPage(0);
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
      valA = String(a.ServiceName || a.ServiceType || a.ServiceCode || "").toLowerCase();
      valB = String(b.ServiceName || b.ServiceType || b.ServiceCode || "").toLowerCase();
    } else if (sortField === "roomStandard") {
      valA = String(a.RoomSubtypeName || a.RoomStandard || a.RoomStandardCode || "").toLowerCase();
      valB = String(b.RoomSubtypeName || b.RoomStandard || b.RoomStandardCode || "").toLowerCase();
    } else if (sortField === "roomType") {
      valA = String(a.RoomName || a.RoomType || "").toLowerCase();
      valB = String(b.RoomName || b.RoomType || "").toLowerCase();
    } else if (sortField === "price") {
      valA = Number(a.Price || 0);
      valB = Number(b.Price || 0);
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedDates.length / PAGE_SIZE);
  const activePage = Math.min(currentPage, Math.max(0, totalPages - 1));
  const startIndex = activePage * PAGE_SIZE;
  const paginatedDates = sortedDates.slice(startIndex, startIndex + PAGE_SIZE);

  const handlePageChange = (pageIndex: number) => {
    setCurrentPage(pageIndex);
    setTimeout(() => {
      document.getElementById("dates")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

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
        <>
          <div className="dates-grid">
            {paginatedDates.map((d: any, i: number) => {
              const indexInSorted = startIndex + i;
              const hashEnc = encodeURIComponent(d.HashCode || `mock:${indexInSorted}:1`);
              const tourOpEnc = encodeURIComponent(d.TourOperator || sp.TourOperator || "");
              const qs = new URLSearchParams({
                AdultCount: String(sp.AdultCount || 2),
                ChildCount: String(sp.ChildCount || 0),
                Ages: String(sp.Ages || ""),
                ...(sp.query ? { query: sp.query } : {}),
                ...(sp.RegionGroup ? { RegionGroup: sp.RegionGroup } : {}),
              }).toString();

              const rowKey = d.HashCode || `${d.StartDate}-${d.Duration}-${d.RoomName}-${d.Price}-${indexInSorted}`;

              return (
                <DateRow
                  key={rowKey}
                  d={d}
                  tourOpEnc={tourOpEnc}
                  hashEnc={hashEnc}
                  qs={qs}
                  adultCount={adultCount}
                  childCount={childCount}
                  ages={ages}
                  type={sp.type}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: "32px", marginBottom: "16px" }}>
              {activePage > 0 && (
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => handlePageChange(activePage - 1)}
                >
                  ‹
                </button>
              )}

              {/* Show first page if not in window */}
              {activePage > 2 && (
                <>
                  <button
                    type="button"
                    className="page-btn"
                    onClick={() => handlePageChange(0)}
                  >
                    1
                  </button>
                  {activePage > 3 && (
                    <span className="page-dots" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", color: "var(--muted)" }}>
                      ...
                    </span>
                  )}
                </>
              )}

              {Array.from({ length: totalPages }, (_, i) => i)
                .filter((i) => i >= activePage - 2 && i <= activePage + 2)
                .map((i) => (
                  <button
                    key={i}
                    type="button"
                    className={`page-btn${i === activePage ? " active" : ""}`}
                    onClick={() => handlePageChange(i)}
                  >
                    {i + 1}
                  </button>
                ))}

              {/* Show last page if not in window */}
              {activePage < totalPages - 3 && (
                <>
                  {activePage < totalPages - 4 && (
                    <span className="page-dots" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", color: "var(--muted)" }}>
                      ...
                    </span>
                  )}
                  <button
                    type="button"
                    className="page-btn"
                    onClick={() => handlePageChange(totalPages - 1)}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {activePage < totalPages - 1 && (
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => handlePageChange(activePage + 1)}
                >
                  ›
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
