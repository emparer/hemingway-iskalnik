//components/ProductCard.tsx
"use client";
import Link from "next/link";

interface Props {
  item: any;
  searchParams?: Record<string, string>;
}

export default function ProductCard({ item, searchParams = {} }: Props) {
  const prod   = item.Product || item || {};
  const name   = prod.OfferName || prod.Name || prod.HotelName || "Ponudba";
  const img    = prod.Picture?.Full || prod.Picture?.Thumbnail || prod.Image || "";
  const giata  = prod.GiataID || item.GiataID || "";
  const tourOp = item.TourOperator || prod.TourOperator || Object.keys(item.TourOperators || {})[0] || "";
  const price  = item.MinPrice || item.MinimumPrice || item.Price || prod.Price || 0;
  const cat    = Number(prod.Category || prod.Stars || 0);
  const rawRating = Number(
    prod.OfferRating ??
    prod.OverallRating ??
    prod.Rating ??
    item.OfferRating ??
    item.OverallRating ??
    item.Rating ??
    item.ProductRating ??
    0
  );
  const rating = rawRating > 10 ? rawRating / 10 : rawRating;

  const loc = [
    prod.Location?.LocationName,
    prod.Location?.RegionGroupName,
    prod.Location?.RegionName,
  ].filter(Boolean).join(" / ");

  const ratingColor = rating >= 8 ? "#15803d" : rating >= 6 ? "#d97706" : "#dc2626";
  const ratingBg    = rating >= 8 ? "#f0fdf4"  : rating >= 6 ? "#fefce8"  : "#fef2f2";

  let tourType = "Paket";
  if (searchParams.type === "hotel") {
    tourType = "Hotel";
  } else if (searchParams.type === "trips") {
    tourType = "Potovanje";
  } else {
    const serviceKeys = Object.keys(item.ServiceTypes || {});
    const roomKeys = Object.keys(item.RoomTypes || {});
    if (serviceKeys.length === 1 && serviceKeys[0] === "TO" && roomKeys.includes("OU")) {
      tourType = "Let";
    }
  }

  const qs = new URLSearchParams({
    ...searchParams,
    ...(tourOp ? { TourOperator: tourOp } : {}),
  }).toString();

  function UserIcon() {
    return (
      <svg
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    );
  }

  return (
    <Link href={`/product/${giata}${qs ? "?" + qs : ""}`} style={{ textDecoration: "none", display: "contents" }}>
      <article className="card">
        <div className="card-media">
          <div className="card-badge">{tourType}</div>
          {img ? (
            <img
              className="card-img"
              src={img}
              alt={name}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="card-img-placeholder">Brez slike</div>
          )}
        </div>

        <div className="card-body">
          <div className="card-title">{name}</div>

          {loc && <div className="card-location">{loc}</div>}

          <div className="card-meta">
            {cat > 0 && (
              <span className="card-chip" style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                {Array.from({ length: Math.min(cat, 5) }).map((_, i) => (
                  <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="#eab308">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
                <span style={{ marginLeft: 2 }}>{cat}</span>
              </span>
            )}
            {rating > 0 && (
              <span
                className="rating-badge"
                style={{ background: ratingBg, color: ratingColor }}
                title="Ocena uporabnikov"
                aria-label={`Ocena uporabnikov ${rating.toFixed(1)} od 10`}
              >
                <UserIcon />
                <span>{rating.toFixed(1)}/10</span>
              </span>
            )}
          </div>

          <div className="card-footer">
            <div className="card-price">
              <small>od </small>
              {Number(price).toLocaleString("sl-SI", { style: "currency", currency: "EUR" })}
            </div>
            <span className="btn card-cta" style={{ padding: "10px 14px", fontSize: 12 }}>
              Prikaži ponudbo
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
