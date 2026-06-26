// components/DateRow.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import CheckoutExtrasNote from "@/components/CheckoutExtrasNote";

interface Props {
  d: any;
  tourOpEnc: string;
  hashEnc: string;
  qs: string;
  adultCount: number;
}

function isReservationPossible(result: any) {
  const status = Number(result?.StatusCode?.Status);
  const action = String(result?.Operator?.Action || "");
  const recordStatus = String(result?.Record?.Status || "");

  return (
    result?.Available === true ||
    status === 0 ||
    status === 2 ||
    action.startsWith("B") ||
    recordStatus === "RQ"
  );
}

function readVerifiedPrice(result: any, fallback: number) {
  const raw =
    result?.Price?.PricePerPerson ??
    result?.Price?.TotalPrice ??
    result?.Price ??
    fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readVerifiedTotalPrice(result: any, fallbackPerPerson: number, adultCount: number) {
  const raw =
    result?.Price?.TotalPrice ??
    result?.TotalPrice ??
    result?.Total ??
    fallbackPerPerson * adultCount;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallbackPerPerson * adultCount;
}

function formatCurrency(value: number) {
  return value.toLocaleString("sl-SI", { style: "currency", currency: "EUR" });
}

function formatDate(dateStr: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    return `${day}.${month}.${year}`;
  }

  return dateStr;
}

function formatPassengerLabel(index: number) {
  return `Potnik ${index}`;
}

function formatTravelersLabel(count: number) {
  if (count === 1) return "1 potnik";
  if (count === 2) return "2 potnika";
  if (count === 3 || count === 4) return `${count} potniki`;
  return `${count} potnikov`;
}

function readFlightLines(result: any) {
  return (result?.Info || [])
    .map((line: string) => String(line).trim())
    .filter((line: string) => line.startsWith("=>") || line.startsWith("<="));
}

function readStatusTone(result: any) {
  const status = Number(result?.StatusCode?.Status);

  if (status === 0) {
    return {
      label: "Potrjeno",
      className: "verified-pill verified-pill-success",
    };
  }

  if (status === 2) {
    return {
      label: "Na povpraševanje",
      className: "verified-pill verified-pill-warning",
    };
  }

  return {
    label: "Preverjeno",
    className: "verified-pill",
  };
}

export default function DateRow({ d, tourOpEnc, hashEnc, qs, adultCount }: Props) {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedExtraLabels, setSelectedExtraLabels] = useState<string[]>([]);

  async function handleVerify() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        TourOperator: d.TourOperator || "PALM",
        HashCode: d.HashCode || "",
        AdultCount: String(adultCount),
        Ages: Array(adultCount).fill(30).join(","),
      });

      const res = await fetch(`/api/ors/verify?${params.toString()}`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (isReservationPossible(result)) {
        setVerified(result);
      } else {
        setError(result.error || "Ponudba ni več na voljo.");
      }
    } catch (err: any) {
      setError(err?.message || "Preverjanje ni uspelo.");
    } finally {
      setLoading(false);
    }
  }

  const perPersonPrice = verified
    ? readVerifiedPrice(verified, Number(d.Price || 0))
    : Number(d.Price || 0);
  const totalPrice = verified
    ? readVerifiedTotalPrice(verified, perPersonPrice, adultCount)
    : perPersonPrice * adultCount;
  const service = verified?.ServiceDesc?.[0] || {};
  const statusTone = verified ? readStatusTone(verified) : null;
  const flightLines = verified ? readFlightLines(verified) : [];
  const travelers = verified ? Object.entries(verified?.Travelers || {}) : [];
  const extras = verified?.ExtraServices || [];
  const roomName = service.RoomName || d.RoomName || "brez namestitve";
  const serviceName = service.ServiceName || d.ServiceName || "samo prevoz";
  const offerName = service.OfferName || d.ProductName || "Ponudba";
  const location = [service.LocationName, service.RegionGroupName || service.RegionName].filter(Boolean).join(" / ");

  const checkoutHref = (() => {
    const searchParams = new URLSearchParams(qs);
    selectedExtraLabels.forEach(value => searchParams.append("extraServices", value));
    return `/checkout/${tourOpEnc}/${hashEnc}?${searchParams.toString()}`;
  })();

  return (
    <div className={`date-row${verified ? " date-row-verified" : ""}`}>
      <div className="date-row-summary">
        <div className="date-meta">
          <span className="date-label">Odhod</span>
          <span>{formatDate(d.StartDate)}</span>
        </div>
        <div className="date-meta">
          <span className="date-label">Povratek</span>
          <span>{formatDate(d.EndDate)}</span>
        </div>
        <div className="date-meta">
          <span className="date-label">Dni</span>
          <span>{d.Duration || "?"}</span>
        </div>
        <div className="date-meta">
          <span className="date-label">Soba</span>
          <span>{roomName}</span>
        </div>
        <div className="date-meta">
          <span className="date-label">Storitev</span>
          <span>{serviceName}</span>
        </div>
        <div className="date-meta">
          <span className="date-label">Cena na osebo</span>
          <span className="date-price">{formatCurrency(perPersonPrice)}</span>
        </div>
        
        {!verified && (
          <button 
            className="btn date-row-action"
            onClick={handleVerify}
            disabled={loading}
          >
            {loading ? "Preverjanje..." : "Preveri"}
          </button>
        )}

        {verified && (
          <Link
            className="btn date-row-action"
            href={checkoutHref}
          >
            Rezerviraj
          </Link>
        )}
      </div>

      {verified && (
        <div className="date-row-expanded">
          <div className="verified-head">
            <div>
              <span className={statusTone?.className}>{statusTone?.label}</span>
              <h3>{offerName}</h3>
              {location && <p>{location}</p>}
            </div>
            <div className="verified-total">
              <span>Skupna cena</span>
              <strong>{formatCurrency(totalPrice)}</strong>
            </div>
          </div>

          <div className="verified-grid">
            <div className="verified-card">
              <span className="verified-card-label">Ponudba</span>
              <strong>{service.Type ? `Tip: ${service.Type}` : "Tip ponudbe ni naveden"}</strong>
              <span>Soba: {roomName}</span>
              <span>Storitev: {serviceName}</span>
              {service.DepartureAirportName && service.ArrivalAirportName && (
                <span>Relacija: {service.DepartureAirportName} - {service.ArrivalAirportName}</span>
              )}
            </div>

            <div className="verified-card">
              <span className="verified-card-label">Cene potnikov</span>
              {travelers.length > 0 ? (
                travelers.map(([key, traveler]: [string, any], index: number) => (
                  <div key={key} className="verified-list-row">
                    <span>{formatPassengerLabel(index + 1)}</span>
                    <strong>{formatCurrency(Number(traveler.Price || perPersonPrice))}</strong>
                  </div>
                ))
              ) : (
                <div className="verified-list-row">
                  <span>{formatTravelersLabel(adultCount)}</span>
                  <strong>{formatCurrency(totalPrice)}</strong>
                </div>
              )}
            </div>

            <div className="verified-card">
              <span className="verified-card-label">Let</span>
              {flightLines.length > 0 ? (
                flightLines.map((line: string) => (
                  <div key={line} className="verified-flight-line">{line}</div>
                ))
              ) : (
                <span>Urnik poletov še ni potrjen. Točne ure letov vam sporočimo ob potrditvi rezervacije.</span>
              )}
            </div>

            <div className="verified-card">
              <span className="verified-card-label">Dodatne storitve</span>
              {extras.length > 0 ? (
                <CheckoutExtrasNote
                  extraServices={extras}
                  initialSelectedValues={selectedExtraLabels}
                  showTextarea={false}
                  onSelectionChange={(_, labels) => {
                    setSelectedExtraLabels((current) => {
                      const same =
                        current.length === labels.length &&
                        current.every((value, index) => value === labels[index]);
                      return same ? current : labels;
                    });
                  }}
                />
              ) : (
                <span>Brez dodatnih storitev.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <div style={{ fontSize: 10, color: "red" }}>{error}</div>}
    </div>
  );
}
