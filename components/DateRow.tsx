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
  type?: string;
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
  const info = result?.Info || [];

  const fromInfo = info
    .map((line: string) => String(line).trim())
    .filter((line: string) => line.startsWith("=>") || line.startsWith("<="));

  if (fromInfo.length > 0) {
    return fromInfo;
  }

  const lines: string[] = [];
  const formatARegex = /([A-Z]{3})\s*-\s*([A-Z]{3})\s+([A-Z0-9]{2,3}\s*\d+)\s+[A-Z]\s+(\d{2}\.\d{2}\.\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})/;
  const formatBRegex = /([HR]):([A-Z]{3})-([A-Z]{3})\s+(\d{2}:\d{2})-(\d{2}:\d{2})\s*\/([A-Z0-9]{2,3}\d+)\/(\d{6})/;
  const routeOutRegex = /H\s*I\s*N\s+([A-Z]{3})\s*-\s*([A-Z]{3})/i;
  const routeInRegex = /R\s*U\s*E\s*C\s*K\s+([A-Z]{3})\s*-\s*([A-Z]{3})/i;
  const formatCLineRegex = /^\s*([CE])\s+(\d{2}\.\d{2})\s+[A-Z]{2}\s+([A-Z0-9]{4,})\s+\d+\s+[A-Z]\s+(\d{2})(\d{2})\s+(\d{2})(\d{2})/;

  let outboundRoute = "";
  let inboundRoute = "";

  for (const rawLine of info) {
    const line = String(rawLine).trim();
    const matchOut = line.match(routeOutRegex);
    if (matchOut) {
      outboundRoute = `${matchOut[1]} - ${matchOut[2]}`;
    }
    const matchIn = line.match(routeInRegex);
    if (matchIn) {
      inboundRoute = `${matchIn[1]} - ${matchIn[2]}`;
    }
  }

  // Format A check
  for (const rawLine of info) {
    const line = String(rawLine).trim();
    const matchA = line.match(formatARegex);
    if (matchA) {
      const [, dep, arr, flightNo, dateStr, depTime, arrTime] = matchA;
      const parts = dateStr.split(".");
      const formattedDate = parts.length === 3 ? `${parts[0]}.${parts[1]}.20${parts[2]}` : dateStr;
      const isReturn = lines.length > 0;
      const prefix = isReturn ? "<=" : "=>";
      lines.push(`${prefix} Let: ${dep} - ${arr}, ${formattedDate} ob ${depTime} - ${arrTime} (${flightNo.replace(/\s+/g, "")})`);
    }
  }

  // Format B check
  if (lines.length === 0) {
    for (const rawLine of info) {
      const line = String(rawLine).trim();
      const matches = [...line.matchAll(new RegExp(formatBRegex, "g"))];
      if (matches.length > 0) {
        for (const match of matches) {
          const [, direction, dep, arr, depTime, arrTime, flightNo, dateStr] = match;
          let formattedDate = dateStr;
          if (dateStr.length === 6) {
            formattedDate = `${dateStr.slice(0, 2)}.${dateStr.slice(2, 4)}.20${dateStr.slice(4, 6)}`;
          }
          const prefix = direction === "H" ? "=>" : "<=";
          lines.push(`${prefix} Let: ${dep} - ${arr}, ${formattedDate} ob ${depTime} - ${arrTime} (${flightNo})`);
        }
        if (lines.length > 0) break;
      }
    }
  }

  // Format C check
  if (lines.length === 0) {
    for (const rawLine of info) {
      const line = String(rawLine);
      const matchC = line.match(formatCLineRegex);
      if (matchC) {
        const [, type, dateStr, flightNo, depH, depM, arrH, arrM] = matchC;
        const prefix = type === "C" ? "=>" : "<=";
        const route = type === "C" ? outboundRoute : inboundRoute;
        lines.push(`${prefix} Let: ${route || flightNo}, ${dateStr}. ob ${depH}:${depM} - ${arrH}:${arrM} (${flightNo})`);
      }
    }
  }

  if (lines.length > 0) {
    return lines;
  }

  const services = result?.Services || {};
  for (const key of Object.keys(services)) {
    const s = services[key];
    if (s && s.Type === "F") {
      const code = s.Code || "";
      const [depAirport, arrAirport] = code.split(/\s+/);

      const formatDateStr = (str: string) => {
        if (!str || str.length !== 8) return str;
        const d = str.slice(0, 2);
        const m = str.slice(2, 4);
        const y = str.slice(4, 8);
        return `${d}.${m}.${y}`;
      };

      if (depAirport && arrAirport) {
        const start = formatDateStr(s.StartDate);
        const end = formatDateStr(s.EndDate);
        lines.push(`=> Let: ${depAirport} - ${arrAirport}${start ? ` (${start})` : ""}`);
        lines.push(`<= Let: ${arrAirport} - ${depAirport}${end ? ` (${end})` : ""}`);
      } else if (code) {
        lines.push(`=> Let: ${code}`);
      }
    }
  }

  return lines;
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

export default function DateRow({ d, tourOpEnc, hashEnc, qs, adultCount, type }: Props) {
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
  const verifyProd = verified?.OfferInfo?.Products?.[0]?.Product || {};
  const verifyLoc = [verifyProd.Location?.LocationName, verifyProd.Location?.RegionGroupName || verifyProd.Location?.RegionName].filter(Boolean).join(" / ");

  const offerName = service.OfferName || verifyProd.OfferName || verifyProd.Name || d.ProductName || "Ponudba";
  const location = verifyLoc || [service.LocationName, service.RegionGroupName || service.RegionName].filter(Boolean).join(" / ");

  const checkoutHref = (() => {
    const searchParams = new URLSearchParams(qs);
    selectedExtraLabels.forEach(value => searchParams.append("extraServices", value));
    searchParams.set("ProductName", offerName);
    searchParams.set("StartDate", d.StartDate || "");
    searchParams.set("EndDate", d.EndDate || "");
    searchParams.set("Duration", String(d.Duration || ""));
    searchParams.set("RoomName", roomName);
    searchParams.set("ServiceName", serviceName);
    searchParams.set("Price", String(perPersonPrice));
    searchParams.set("LocationName", location || d.FlightRoute || "");
    if (d.FlightRoute) {
      searchParams.set("FlightRoute", d.FlightRoute);
    }
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
          <span className="date-label">Prevoz</span>
          <span>{d.DepartureAirportName || d.DepartureAirport || d.EntryPointName || "Lasten prevoz"}</span>
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
              {verified?.OfferInfo?.Dates?.[0]?.EntryPointName && (
                <span>Vstopno mesto: {verified.OfferInfo.Dates[0].EntryPointName}</span>
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

            {((type === "pauschal" || !type) || (flightLines.length > 0)) && (
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
            )}

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
