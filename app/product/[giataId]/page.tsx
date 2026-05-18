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

  return (
    <main className="container">
      <div style={{ paddingTop: 16 }}>
        <Link
          href={`/?type=${sp.type || "pauschal"}&query=${encodeURIComponent(sp.query || "Turčija")}&RegionGroup=${sp.RegionGroup || "724"}`}
          className="back-link"
        >
          ← Nazaj na ponudbe
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

      {data.usingMock && <p className="mock-notice">⚠ Mock mode: {data.error}</p>}

      <div className="hero">
        <div className="gallery-wrap">
          <GalleryClient pictures={pictures} alt={name} />
        </div>
        <aside className="product-side">
          <h1>{name}</h1>
          {loc && <p className="location">📍 {loc}</p>}
          {stars && <div style={{ fontSize: 18, color: "#f59e0b" }}>{stars}</div>}
          {rating > 0 && (
            <span style={{ background: ratingBg, color: ratingColor, fontWeight: 700, fontSize: 13, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>
              Ocena gostov: {rating}/10
            </span>
          )}
          <div style={{ marginTop: "auto" }}>
            <a href="#dates" className="btn" style={{ display: "block", textAlign: "center" }}>
              📅 Preveri termine in cene
            </a>
          </div>
        </aside>
      </div>

      <section className="tabs" id="dates">
        <h2>Termini in cene</h2>
        <div className="date-row date-row-header">
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

        {dates.map((d: any, i: number) => {
          const hashEnc   = encodeURIComponent(d.HashCode || `mock:${i}:1`);
          const tourOpEnc = encodeURIComponent(d.TourOperator || sp.TourOperator || "PALM");
          const qs = new URLSearchParams({
            AdultCount: String(sp.AdultCount || 2),
            ...(sp.query       ? { query:       sp.query }       : {}),
            ...(sp.RegionGroup ? { RegionGroup: sp.RegionGroup } : {}),
          }).toString();

          return (
            <div className="date-row" key={i} style={{ background: i % 2 === 1 ? "#fafafa" : "transparent" }}>
              <span>{d.StartDate || "—"}</span>
              <span>{d.EndDate || "—"}</span>
              <span>{d.Duration || "?"}</span>
              <span style={{ fontSize: 12 }}>{d.RoomName || "brez namestitve"}</span>
              <span style={{ fontSize: 12 }}>{d.ServiceName || "samo prevoz"}</span>
              <span className="date-price">
                {Number(d.Price || 0).toLocaleString("sl-SI", { style: "currency", currency: "EUR" })}
              </span>
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
      </section>

      <section className="tabs">
        <h2>Opis ponudbe</h2>
        {prod.Description || prod.DescriptionSI ? (
          <div
            style={{ fontSize: 14, lineHeight: 1.8, color: "#374151" }}
            dangerouslySetInnerHTML={{ __html: prod.Description || prod.DescriptionSI || "" }}
          />
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: "#374151" }}>
            <p><strong>Cena vključuje:</strong> povraten let v izbran kraj, letališke in varnostne pristojbine, 20 kg oddane prtljage, 5 kg ročne prtljage, prigrizek in napitek med poletom, predstavnika agencije v informacijski poslovalnici na letališču.</p>
            <p style={{ marginTop: 12 }}>Opisi objektov so povzeti iz spletnih strani/brošur/informacij s strani partnerjev.</p>
          </div>
        )}
      </section>
    </main>
  );
}
