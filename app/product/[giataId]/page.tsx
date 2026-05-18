//app/product/[giataId]/page.tsx
import SearchBox from "@/components/SearchBox";
import GalleryClient from "@/components/GalleryClient";
import { searchDates } from "@/lib/ors";
import Link from "next/link";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ giataId: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { giataId } = await params;
  const sp = await searchParams;

  const data = await searchDates({
    type:         sp.type || "pauschal",
    GiataID:      giataId,
    TourOperator: sp.TourOperator || "",
    RegionGroup:  sp.RegionGroup || "724",
    StartDate:    sp.StartDate || "19.05.2026",
    EndDate:      sp.EndDate || "18.05.2027",
    AdultCount:   sp.AdultCount || 2,
  });

  const prod    = data.Results?.[0]?.Product || {};
  const dates   = data.Dates || [];
  const name    = prod.OfferName || prod.Name || "Ponudba";
  const cat     = Number(prod.Category || 0);
  const stars   = "★".repeat(Math.min(cat, 5));
  const rating  = Number(prod.OverallRating || prod.Rating || 0);

  const loc = [
    prod.Location?.LocationName,
    prod.Location?.RegionGroupName,
    prod.Location?.RegionName,
  ].filter(Boolean).join(" / ");

  const pictures: string[] = [
    prod.Picture?.Full,
    ...(prod.Pictures || []).map((p: any) => p.Full || p.Url || p),
    prod.Picture?.Thumbnail,
  ].filter((s): s is string => Boolean(s) && !s.includes("no-image"));

  const ratingColor = rating >= 8 ? "#15803d" : rating >= 6 ? "#d97706" : "#dc2626";
  const ratingBg    = rating >= 8 ? "#f0fdf4"  : rating >= 6 ? "#fefce8"  : "#fef2f2";
  const typeLabel =
    sp.type === "hotel" ? "Hotel stay" :
    sp.type === "trips" ? "Bus journey" :
    "Flight package";

  return (
    <main className="container page-shell">
      <div style={{ paddingTop: 16 }}>
        <Link
          href={`/?type=${sp.type || "pauschal"}&query=${encodeURIComponent(sp.query || "Turčija")}&RegionGroup=${sp.RegionGroup || "724"}`}
          className="back-link"
        >
          Nazaj na ponudbe
        </Link>
      </div>

      <SearchBox
        defaultQuery={sp.query || prod.Location?.RegionGroupName || "Turčija"}
        defaultRegionGroup={String(sp.RegionGroup || prod.Location?.RegionGroupID || 724)}
        defaultStartDate={sp.StartDate || "19.05.2026"}
        defaultEndDate={sp.EndDate || "18.05.2027"}
        defaultAdultCount={Number(sp.AdultCount || 2)}
        type={sp.type || "pauschal"}
      />

      {data.usingMock && <p className="mock-notice">Mock mode: {data.error}</p>}

      <div className="hero">
        <div className="gallery-wrap">
          <GalleryClient pictures={pictures} alt={name} />
        </div>
        <aside className="product-side">
          <div className="eyebrow" style={{ color: "var(--c)", background: "rgba(139, 53, 63, 0.08)" }}>{typeLabel}</div>
          <h1>{name}</h1>
          {loc && <p className="location">{loc}</p>}
          <div className="product-meta">
            {stars && <span className="card-chip">{cat} zvezdic</span>}
            {rating > 0 && (
              <span className="rating-badge" style={{ background: ratingBg, color: ratingColor }}>
                Ocena {rating}/10
              </span>
            )}
          </div>
          <div className="detail-stat-grid">
            <div className="detail-stat">
              <span>Tip poti</span>
              <strong>{sp.type === "hotel" ? "Samo namestitev" : sp.type === "trips" ? "Avtobusno potovanje" : "Letalska ponudba"}</strong>
            </div>
            <div className="detail-stat">
              <span>Potniki</span>
              <strong>{sp.AdultCount || 2} odrasli</strong>
            </div>
            <div className="detail-stat">
              <span>Odhodno okno</span>
              <strong>{sp.StartDate || "19.05.2026"}</strong>
            </div>
            <div className="detail-stat">
              <span>Povratno okno</span>
              <strong>{sp.EndDate || "18.05.2027"}</strong>
            </div>
          </div>
          <p className="muted">
            Pregled ponudbe je prilagojen hitri primerjavi terminov, storitev in cene na osebo.
          </p>
          <div style={{ marginTop: "auto" }}>
            <a href="#dates" className="btn" style={{ display: "block", textAlign: "center" }}>
              Preveri termine in cene
            </a>
          </div>
        </aside>
      </div>

      <section className="tabs" id="dates">
        <h2>Termini in cene</h2>
        <div className="date-row-header">
          <b>Odhod</b>
          <b>Povratek</b>
          <b>Dni</b>
          <b>Soba</b>
          <b>Storitev</b>
          <b>Cena / os.</b>
          <span />
        </div>

        {dates.length === 0 && (
          <div style={{ padding: "24px 4px", color: "var(--muted)", fontSize: 14 }}>
            Ni razpoložljivih terminov.
          </div>
        )}

        <div className="dates-grid">
          {dates.map((d: any, i: number) => {
            const hashEnc   = encodeURIComponent(d.HashCode || `mock:${i}:1`);
            const tourOpEnc = encodeURIComponent(d.TourOperator || sp.TourOperator || "PALM");
            const qs = new URLSearchParams({
              AdultCount: String(sp.AdultCount || 2),
              ...(sp.query       ? { query:       sp.query }       : {}),
              ...(sp.RegionGroup ? { RegionGroup: sp.RegionGroup } : {}),
            }).toString();

            return (
              <div className="date-row" key={i}>
                <div className="date-meta">
                  <span className="date-label">Odhod</span>
                  <span>{d.StartDate || "—"}</span>
                </div>
                <div className="date-meta">
                  <span className="date-label">Povratek</span>
                  <span>{d.EndDate || "—"}</span>
                </div>
                <div className="date-meta">
                  <span className="date-label">Dni</span>
                  <span>{d.Duration || "?"}</span>
                </div>
                <div className="date-meta">
                  <span className="date-label">Soba</span>
                  <span>{d.RoomName || "brez namestitve"}</span>
                </div>
                <div className="date-meta">
                  <span className="date-label">Storitev</span>
                  <span>{d.ServiceName || "samo prevoz"}</span>
                </div>
                <div className="date-meta">
                  <span className="date-label">Cena na osebo</span>
                  <span className="date-price">
                    {Number(d.Price || 0).toLocaleString("sl-SI", { style: "currency", currency: "EUR" })}
                  </span>
                </div>
                <Link
                  className="btn"
                  style={{ padding: "7px 12px", fontSize: 12, whiteSpace: "nowrap" }}
                  href={`/checkout/${tourOpEnc}/${hashEnc}?${qs}`}
                >
                  Rezerviraj
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="tabs">
        <h2>Opis ponudbe</h2>
        {prod.Description || prod.DescriptionSI ? (
          <div
            className="rich-text"
            dangerouslySetInnerHTML={{ __html: prod.Description || prod.DescriptionSI || "" }}
          />
        ) : (
          <div className="rich-text">
            <p><strong>Cena vključuje:</strong> povraten let v izbran kraj, letališke in varnostne pristojbine, 20 kg oddane prtljage, 5 kg ročne prtljage, prigrizek in napitek med poletom, predstavnika agencije v informacijski poslovalnici na letališču.</p>
            <p style={{ marginTop: 12 }}>Opisi objektov so povzeti iz spletnih strani/brošur/informacij s strani partnerjev.</p>
          </div>
        )}
      </section>
    </main>
  );
}
