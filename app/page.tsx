//app/page.tsx
import SearchBox from "@/components/SearchBox";
import ProductCard from "@/components/ProductCard";
import Filters from "@/components/Filters";
import { searchProducts } from "@/lib/ors";
import Link from "next/link";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;

  const data = await searchProducts({
    type:        sp.type        || "pauschal",
    query:       sp.query       || "Turčija",
    RegionGroup: sp.RegionGroup || "724",
    StartDate:   sp.StartDate,
    EndDate:     sp.EndDate,
    AdultCount:  sp.AdultCount,
    Duration:    sp.Duration,
    ServiceType: sp.ServiceType,
    MinimumCategory: sp.MinimumCategory,
    Page:        sp.Page        || "0",
    SortField:   sp.SortField   || "Price",
    SortDir:     sp.SortDir     || "asc",
    ProductName: sp.ProductName,
    "Filter[Category][]":    sp["Filter[Category][]"],
    "Filter[ServiceType][]": sp["Filter[ServiceType][]"],
    "Filter[RoomType][]":    sp["Filter[RoomType][]"],
    "Filter[Region][]":      sp["Filter[Region][]"],
    "Filter[Location][]":    sp["Filter[Location][]"],
    "RFilter[Price]":        sp["RFilter[Price]"],
  });

  const results  = data.Results || [];
  const count    = data.Count || results.length;
  const perPage  = data.PerPage || 12;
  const pages    = Math.ceil(count / perPage);
  const page     = Number(sp.Page || 0);
  const type     = sp.type || "pauschal";

  function sortUrl(field: string, dir: string) {
    const p = new URLSearchParams({ ...sp, SortField: field, SortDir: dir, Page: "0" });
    return "?" + p.toString();
  }

  function pageUrl(n: number) {
    const p = new URLSearchParams({ ...sp, Page: String(n) });
    return "?" + p.toString();
  }

  return (
    <main className="container">
      <SearchBox
        defaultQuery={sp.query || "Turčija"}
        defaultRegionGroup={sp.RegionGroup || "724"}
        defaultStartDate={sp.StartDate || "19.05.2026"}
        defaultEndDate={sp.EndDate || "18.05.2027"}
        defaultAdultCount={Number(sp.AdultCount || 2)}
        type={type}
      />

      {data.usingMock && (
        <p className="mock-notice">⚠ Mock mode — ORS API nedosegljiv: {data.error}</p>
      )}

      <div className="layout">
        <Filters data={data} />

        <section>
          <div className="topbar">
            <div className="topbar-count">Najdenih {count} ponudb.</div>
            <div className="sort-btns">
              <Link className="btn-light" href={sortUrl("Price", "asc")}>↑ Cena</Link>
              <Link className="btn-light" href={sortUrl("Price", "desc")}>↓ Cena</Link>
              <Link className="btn-light" href={sortUrl("OverallRating", "desc")}>♥ Ocena</Link>
              <Link className="btn-light" href={sortUrl("Category", "desc")}>★ Kategorija</Link>
            </div>
          </div>

          {results.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
              Ni rezultatov za izbrane kriterije.
            </div>
          ) : (
            <div className="product-grid">
              {results.map((item: any, i: number) => (
                <ProductCard key={i} item={item} searchParams={sp} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="pagination">
              {page > 0 && <Link className="page-btn" href={pageUrl(page - 1)}>‹</Link>}
              {Array.from({ length: Math.min(pages, 8) }, (_, i) => (
                <Link key={i} className={`page-btn${i === page ? " active" : ""}`} href={pageUrl(i)}>
                  {i + 1}
                </Link>
              ))}
              {page < pages - 1 && <Link className="page-btn" href={pageUrl(page + 1)}>›</Link>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
