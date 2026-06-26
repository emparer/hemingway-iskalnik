//app/page.tsx
import SearchBox from "@/components/SearchBox";
import ProductCard from "@/components/ProductCard";
import Filters from "@/components/Filters";
import { searchProducts } from "@/lib/ors";
import Link from "next/link";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const sp = await searchParams;

  const pickParam = (val: any): string => {
    if (!val) return "";
    if (Array.isArray(val)) return val[0] || "";
    return String(val);
  };
  const depAirport = pickParam(sp.DepartureAirports) || pickParam(sp["DepartureAirports[]"]);

  const defaultQuery = "";
  const defaultRegionGroup = "";

  function inferMinService(serviceCodes: any): string {
    if (!serviceCodes) return "";
    const arr = Array.isArray(serviceCodes) ? serviceCodes : [serviceCodes];
    if (arr.includes("OV")) return "OV";
    if (arr.includes("BB")) return "BB";
    if (arr.includes("HB")) return "HB";
    if (arr.includes("AI")) return "AI";
    return "";
  }

  const data = await searchProducts({
    type:        sp.type        || "pauschal",
    query:       sp.query !== undefined ? sp.query : defaultQuery,
    RegionGroup: sp.RegionGroup !== undefined ? sp.RegionGroup : defaultRegionGroup,
    Region:      sp.Region,
    Location:    sp.Location,
    GiataID:     sp.GiataID,
    StartDate:   sp.StartDate,
    EndDate:     sp.EndDate,
    AdultCount:  sp.AdultCount,
    Duration:    sp.Duration,
    ServiceType: sp.ServiceType,
    Page:        sp.Page        || "0",
    SortField:   sp.SortField   || "Price",
    SortDir:     sp.SortDir     || "asc",
    ProductName: sp.ProductName,
    // New specific fields
    DepartureAirports: depAirport || undefined,
    MinCategory:       sp.MinCategory,
    ServiceCodes:      sp.ServiceCodes || sp["ServiceCodes[]"],
    SubType:           sp.SubType,
    "Filter[Category][]":    sp["Filter[Category][]"],
    "Filter[ServiceType][]": sp["Filter[ServiceType][]"],
    "Filter[RoomType][]":    sp["Filter[RoomType][]"],
    "Filter[Region][]":      sp["Filter[Region][]"],
    "Filter[Location][]":    sp["Filter[Location][]"],
    "RFilter[Price]":        sp["RFilter[Price]"],
  });

  const results  = data.Results || [];
  const count    = data.Count || results.length;
  const pages    = data.Pages || 1;
  const page     = Number(sp.Page || 0);
  const type     = sp.type || "pauschal";
  const activeSortField = sp.SortField || "Price";
  const activeSortDir = sp.SortDir || "asc";

  function buildQueryString(updates: Record<string, string>) {
    const p = new URLSearchParams();
    
    // Add all existing parameters
    for (const [key, value] of Object.entries(sp)) {
      if (key in updates) continue;
      
      if (Array.isArray(value)) {
        for (const item of value) {
          p.append(key, item);
        }
      } else if (value !== undefined) {
        p.append(key, value as string);
      }
    }
    
    // Add updates
    for (const [key, val] of Object.entries(updates)) {
        p.set(key, val);
    }
    return "?" + p.toString();
  }

  function sortUrl(field: string, dir: string) {
    return buildQueryString({ SortField: field, SortDir: dir, Page: "0" });
  }

  function pageUrl(n: number) {
    return buildQueryString({ Page: String(n) });
  }

  return (
    <main className="container page-shell">
      <SearchBox
        defaultQuery={sp.query !== undefined ? String(sp.query) : defaultQuery}
        defaultRegionGroup={sp.RegionGroup !== undefined ? String(sp.RegionGroup) : defaultRegionGroup}
        defaultStartDate={sp.StartDate ? String(sp.StartDate) : ""}
        defaultEndDate={sp.EndDate ? String(sp.EndDate) : ""}
        defaultAdultCount={Number(sp.AdultCount || 2)}
        defaultDepartureAirports={depAirport}
        type={Array.isArray(type) ? type[0] : type}
        defaultDuration={sp.Duration ? String(sp.Duration) : ""}
        defaultMinService={inferMinService(sp.ServiceCodes || sp["ServiceCodes[]"])}
        defaultMinCategory={sp.MinCategory ? String(sp.MinCategory) : ""}
        defaultSubType={sp.SubType ? String(sp.SubType) : ""}
      />

      {data.usingMock && (
        <p className="mock-notice">Mock mode. ORS API ni dosegljiv: {data.error}</p>
      )}

      <div className="layout">
        <Filters data={data} />

        <section className="results-panel">
          <div className="topbar">
            <div className="topbar-copy">
              <p className="eyebrow" style={{ color: "var(--c)", background: "rgba(139, 53, 63, 0.08)", marginBottom: 12 }}>
                Ponudbe
              </p>
              <p className="topbar-count">Najdenih {count} ponudb.</p>
            </div>
            <div className="sort-btns">
              <Link 
                className={`btn-light${activeSortField === "Price" ? " active" : ""}`} 
                href={sortUrl("Price", activeSortField === "Price" && activeSortDir === "asc" ? "desc" : "asc")}
              >
                Cena {activeSortField === "Price" ? (activeSortDir === "asc" ? "↑" : "↓") : ""}
              </Link>
              <Link className={`btn-light${activeSortField === "OverallRating" ? " active" : ""}`} href={sortUrl("OverallRating", "desc")}>Najboljše ocene {activeSortField === "OverallRating" ? "↓" : ""}</Link>
              <Link className={`btn-light${activeSortField === "Category" ? " active" : ""}`} href={sortUrl("Category", "desc")}>Najvišja kategorija {activeSortField === "Category" ? "↓" : ""}</Link>
            </div>
          </div>

          {results.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
              Ni rezultatov za izbrane kriterije.
            </div>
          ) : (
            <div className="product-grid">
              {results.map((item: any, i: number) => (
                <ProductCard key={i} item={item} searchParams={sp as Record<string, string>} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="pagination">
              {page > 0 && <Link className="page-btn" href={pageUrl(page - 1)}>‹</Link>}
              
              {/* Show first page if not in window */}
              {page > 2 && (
                <>
                  <Link className="page-btn" href={pageUrl(0)}>1</Link>
                  {page > 3 && <span className="page-dots">...</span>}
                </>
              )}

              {Array.from({ length: pages }, (_, i) => i)
                .filter(i => i >= page - 2 && i <= page + 2)
                .map(i => (
                  <Link key={i} className={`page-btn${i === page ? " active" : ""}`} href={pageUrl(i)}>
                    {i + 1}
                  </Link>
                ))}

              {/* Show last page if not in window */}
              {page < pages - 3 && (
                <>
                  {page < pages - 4 && <span className="page-dots">...</span>}
                  <Link className="page-btn" href={pageUrl(pages - 1)}>{pages}</Link>
                </>
              )}

              {page < pages - 1 && <Link className="page-btn" href={pageUrl(page + 1)}>›</Link>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
