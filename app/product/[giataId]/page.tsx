//app/product/[giataId]/page.tsx
import SearchBox from "@/components/SearchBox";
import GalleryClient from "@/components/GalleryClient";
import DatesList from "@/components/DatesList";
import { searchDates, searchProducts, getProductInfo } from "@/lib/ors";
import { resolveTourOperator } from "@/lib/tour-operator";
import Link from "next/link";

function getFirstProduct(productData: any, giataId: string) {
  const results = productData.Results || [];

  const item =
    results.find((r: any) => {
      const prod = r.Product || r;
      return String(prod.GiataID || r.GiataID || "") === String(giataId);
    }) || results[0];

  return item?.Product || item || {};
}

function UserIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ giataId: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { giataId } = await params;
  const sp = await searchParams;

  const pickParam = (val: any): string => {
    if (!val) return "";
    if (Array.isArray(val)) return val[0] || "";
    return String(val);
  };
  const depAirport = pickParam(sp.DepartureAirports) || pickParam(sp["DepartureAirports[]"]);

  const productData = await searchProducts({
    ...sp,
    GiataID: giataId,
    type: sp.type || "pauschal",
    AdultCount: Number(sp.AdultCount || 2),
    ChildCount: sp.ChildCount,
    Ages: sp.Ages,
    DepartureAirports: depAirport || undefined,
  });

  const dateData = await searchDates({
    ...sp,
    GiataID: giataId,
    type: sp.type || "pauschal",
    AdultCount: Number(sp.AdultCount || 2),
    ChildCount: sp.ChildCount,
    Ages: sp.Ages,
    Count: 500, // Load all available offers up to 500
    DepartureAirports: depAirport || undefined,
  });

  const results = productData.Results || [];
  const matchingItem = results.find((r: any) => {
    const p = r.Product || r;
    return String(p.GiataID || r.GiataID || "") === String(giataId);
  }) || results[0];

  const resolvedTourOperator = resolveTourOperator({
    searchParams: sp,
    matchingItem,
  });

  let infoData = resolvedTourOperator
    ? await getProductInfo({
        GiataID: giataId,
        TourOperator: resolvedTourOperator,
        StartDate: sp.StartDate,
      })
    : {};

  // If the resolved operator has no images, try other operators offering this hotel
  if ((!infoData?.Images || infoData.Images.length === 0) && matchingItem?.TourOperators) {
    const otherOperators = Object.keys(matchingItem.TourOperators).filter(
      op => op !== resolvedTourOperator
    );
    for (const op of otherOperators) {
      const fallbackInfo = await getProductInfo({
        GiataID: giataId,
        TourOperator: op,
        StartDate: sp.StartDate,
      });
      if (fallbackInfo?.Images && fallbackInfo.Images.length > 0) {
        infoData = fallbackInfo;
        break;
      }
    }
  }

  const prod = getFirstProduct(productData, giataId);
  const dates = dateData.Dates || [];
  const name    = prod.OfferName || prod.Name || "Ponudba";
  const cat     = Number(prod.Category || 0);
  const rating = Number(prod.OverallRating || prod.Rating || 0) > 10 
    ? Number(prod.OverallRating || prod.Rating || 0) / 10 
    : Number(prod.OverallRating || prod.Rating || 0);
const formatDate = (dateStr: string) => {
  return dateStr;
};


  const loc = [
    prod.Location?.LocationName,
    prod.Location?.RegionGroupName,
    prod.Location?.RegionName,
  ].filter(Boolean).join(" / ");

  type GalleryPicture = {
    full: string;
    thumb: string;
  };

  function collectGalleryPictures(infoData: any, prod: any) {
    const pictures: GalleryPicture[] = [];

    // Best source: ORS product info Images array
    if (Array.isArray(infoData?.Images)) {
      for (const img of infoData.Images) {
        let full = img.URLFull || img.Full || img.URL;
        let thumb = img.Thumb || img.Thumbnail || img.URL || full;

        if (full && typeof full === "string") {
          full = full.trim();
          if (full.startsWith("//")) {
            full = "https:" + full;
          }
          if (thumb && typeof thumb === "string") {
            thumb = thumb.trim();
            if (thumb.startsWith("//")) {
              thumb = "https:" + thumb;
            }
          }

          if (full.startsWith("http") && !full.includes("no-image")) {
            pictures.push({
              full,
              thumb: thumb || full,
            });
          }
        }
      }
    }

    // Fallback only if there are no gallery images
    if (!pictures.length) {
      let full =
        infoData?.Product?.Picture?.Full ||
        prod?.Picture?.Large ||
        prod?.Picture?.Full;
      let thumb =
        infoData?.Product?.Picture?.Thumbnail ||
        prod?.Picture?.Thumbnail ||
        full;

      if (full && typeof full === "string") {
        full = full.trim();
        if (full.startsWith("//")) {
          full = "https:" + full;
        }
        if (thumb && typeof thumb === "string") {
          thumb = thumb.trim();
          if (thumb.startsWith("//")) {
            thumb = "https:" + thumb;
          }
        }

        if (full.startsWith("http") && !full.includes("no-image")) {
          pictures.push({
            full,
            thumb: thumb || full,
          });
        }
      }
    }

    return pictures;
  }

  const galleryPictures = collectGalleryPictures(infoData, prod);
  const ratingColor = rating >= 8 ? "#15803d" : rating >= 6 ? "#d97706" : "#dc2626";
  const ratingBg    = rating >= 8 ? "#f0fdf4"  : rating >= 6 ? "#fefce8"  : "#fef2f2";

  function inferMinService(serviceCodes: any): string {
    if (!serviceCodes) return "";
    const arr = Array.isArray(serviceCodes) ? serviceCodes : [serviceCodes];
    if (arr.includes("OV")) return "OV";
    if (arr.includes("BB")) return "BB";
    if (arr.includes("HB")) return "HB";
    if (arr.includes("AI")) return "AI";
    return "";
  }

  return (
    <main className="container page-shell">
      <SearchBox
        defaultQuery={sp.query !== undefined ? String(sp.query) : ""}
        defaultRegionGroup={sp.RegionGroup !== undefined ? String(sp.RegionGroup) : String(prod.Location?.RegionGroupID || "")}
        defaultStartDate={sp.StartDate || ""}
        defaultEndDate={sp.EndDate || ""}
        defaultAdultCount={Number(sp.AdultCount || 2)}
        defaultChildCount={Number(sp.ChildCount || 0)}
        defaultAges={sp.Ages ? String(sp.Ages) : ""}
        defaultDepartureAirports={depAirport}
        type={sp.type || "pauschal"}
        defaultDuration={sp.Duration ? String(sp.Duration) : ""}
        defaultMinService={inferMinService(sp.ServiceCodes || sp["ServiceCodes[]"])}
        defaultMinCategory={sp.MinCategory ? String(sp.MinCategory) : ""}
        defaultSubType={sp.SubType ? String(sp.SubType) : ""}
      />

      {(productData.usingMock || dateData.usingMock) && (
        <p className="mock-notice">
          Mock mode: {productData.error || dateData.error}
        </p>
      )}

      <div className="layout">
        <section className="results-panel results-panel-full">
          <div className="offer-header">
            <div className="eyebrow">{prod.Location?.RegionGroupName}</div>
            <div className="product-title-row">
              <h1>{name}</h1>
              {cat > 0 && (
                <span className="card-chip product-stars">
                  {Array.from({ length: Math.min(cat, 5) }).map((_, i) => (
                    <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#eab308">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                  <span>{cat}</span>
                </span>
              )}
            </div>
            <div className="product-meta">
              {rating > 0 && (
                <span className="rating-badge" style={{ background: ratingBg, color: ratingColor }}>
                  Ocena {rating}/10
                </span>
              )}
            </div>
          </div>

          <div className="product-hero">
            <GalleryClient pictures={galleryPictures} alt={name} />
            <aside className="product-side">
              <h3 className="product-side-title">Povzetek iskanja</h3>
              <div className="detail-stat-grid">
                <div className="detail-stat">
                  <span>Tip poti</span>
                  <strong>{sp.type === "hotel" ? "Samo namestitev" : sp.type === "trips" ? "Avtobusno potovanje" : "Letalska ponudba"}</strong>
                </div>
                <div className="detail-stat">
                  <span>Potniki</span>
                  <strong>
                    {Number(sp.AdultCount || 2)} odrasli
                    {Number(sp.ChildCount || 0) > 0 ? `, ${sp.ChildCount} otrok` : ""}
                  </strong>
                </div>
                <div className="detail-stat">
                  <span>Odhod med</span>
                  <strong>{formatDate(sp.StartDate || "19.05.2026")}</strong>
                </div>
                <div className="detail-stat">
                  <span>Povratek do</span>
                  <strong>{formatDate(sp.EndDate || "18.05.2027")}</strong>
                </div>
              </div>
              <p className="muted">
                Pregled ponudbe je prilagojen hitri primerjavi terminov, storitev in cene na osebo.
              </p>
              <div className="product-side-cta">
                <a href="#dates" className="btn product-side-btn">
                  Preveri termine in cene
                </a>
              </div>
            </aside>
          </div>
        </section>
      </div>

      <section className="tabs" id="dates">
        <h2>Termini in cene</h2>
        <DatesList
          dates={dates}
          sp={{ ...sp, TourOperator: resolvedTourOperator }}
          adultCount={Number(sp.AdultCount || 2)}
          childCount={Number(sp.ChildCount || 0)}
          ages={sp.Ages ? String(sp.Ages) : ""}
        />
      </section>

      <section className="tabs product-description">
        <h2 className="product-description-title">Opis ponudbe</h2>
        {(infoData?.Description || prod.Description || prod.DescriptionSI) ? (
          <div
            className="rich-text"
            dangerouslySetInnerHTML={{ __html: infoData.Description || prod.Description || prod.DescriptionSI || "" }}
          />
        ) : (
          <div className="rich-text">
            <p><strong>Cena vključuje:</strong> povraten let v izbran kraj, letališke in varnostne pristojbine, 20 kg oddane prtljage, 5 kg ročne prtljage, prigrizek in napitek med poletom, predstavnika agencije v informacijski poslovalnici na letališču.</p>
            <p className="product-description-note">Opisi objektov so povzeti iz spletnih strani/brošur/informacij s strani partnerjev.</p>
          </div>
        )}
      </section>
    </main>
  );
}
