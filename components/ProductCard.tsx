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
  const rating = Number(prod.OverallRating || prod.Rating || 0);

  const loc = [
    prod.Location?.LocationName,
    prod.Location?.RegionGroupName,
    prod.Location?.RegionName,
  ].filter(Boolean).join(" / ");

  const stars = "★".repeat(Math.min(cat, 5));
  const ratingColor = rating >= 8 ? "#15803d" : rating >= 6 ? "#d97706" : "#dc2626";
  const ratingBg    = rating >= 8 ? "#f0fdf4"  : rating >= 6 ? "#fefce8"  : "#fef2f2";

  const qs = new URLSearchParams({
    ...searchParams,
    ...(tourOp ? { TourOperator: tourOp } : {}),
  }).toString();

  return (
    <Link href={`/product/${giata}${qs ? "?" + qs : ""}`} style={{ textDecoration: "none", display: "contents" }}>
      <article className="card">
        {img ? (
          <img
            className="card-img"
            src={img}
            alt={name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="card-img-placeholder">📷 Ni slike</div>
        )}

        <div className="card-body">
          <div className="card-title">{name}</div>

          {loc && <div className="card-location">📍 {loc}</div>}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {stars && <span className="card-stars">{stars}</span>}
            {rating > 0 && (
              <span className="rating-badge" style={{ background: ratingBg, color: ratingColor }}>
                {rating}/10
              </span>
            )}
          </div>

          <div className="card-footer">
            <div className="card-price">
              <small>od </small>
              {Number(price).toLocaleString("sl-SI", { style: "currency", currency: "EUR" })}
            </div>
            <span className="btn" style={{ padding: "7px 14px", fontSize: 12 }}>
              Prikaži ponudbo
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
