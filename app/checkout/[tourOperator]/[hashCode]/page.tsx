//app/checkout/[tourOperator]/[hashCode]/page.tsx
import { verifyOffer } from "@/lib/ors";
import CheckoutExtrasNote from "@/components/CheckoutExtrasNote";

function parsePriceValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const normalized = value
      .trim()
      .replace(/\s/g, "")
      .replace(/€/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
}

function formatCurrency(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  const safeValue = Number.isFinite(parsed) ? parsed : 0;

  return safeValue.toLocaleString("sl-SI", { style: "currency", currency: "EUR" });
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    return `${day}.${month}.${year}`;
  }
  return dateStr;
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ tourOperator: string; hashCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tourOperator, hashCode } = await params;
  const sp = await searchParams;

  const adultCount = Number(sp.AdultCount || 2);
  const verify = await verifyOffer(tourOperator, decodeURIComponent(hashCode), adultCount);
  
  // If verify is using mock data (meaning API fails or is in mock mode), we prioritize the real selected price from sp.Price
  const rawPrice = !verify.usingMock 
    ? (verify.Price?.TotalPrice ?? verify.Price?.PricePerPerson ?? verify.Price ?? verify.TotalPrice ?? verify.OfferPrice ?? verify.Total)
    : null;

  const offerPrice =
    parsePriceValue(rawPrice) ??
    (sp.Price ? parsePriceValue(sp.Price) : undefined) ??
    1118;

  const registrationFee = 20;
  const total = offerPrice + registrationFee;
  const extraServices = Array.isArray(verify.ExtraServices) ? verify.ExtraServices : [];
  const initialSelectedExtraValues = Array.isArray(sp.extraServices)
    ? sp.extraServices.map(value => String(value))
    : sp.extraServices
      ? [String(sp.extraServices)]
      : [];

  const service = verify?.ServiceDesc?.[0] || {};
  const startDate = service.StartDate || verify.StartDate || (typeof sp.StartDate === "string" ? sp.StartDate : "") || "";
  const endDate = service.EndDate || verify.EndDate || (typeof sp.EndDate === "string" ? sp.EndDate : "") || "";
  const duration = service.Duration || verify.Duration || (typeof sp.Duration === "string" ? sp.Duration : "") || "";
  const roomName = service.RoomName || (typeof sp.RoomName === "string" ? sp.RoomName : "") || "brez namestitve";
  const serviceName = service.ServiceName || (typeof sp.ServiceName === "string" ? sp.ServiceName : "") || "samo prevoz";
  const offerName = service.OfferName || (typeof sp.ProductName === "string" ? sp.ProductName : "") || "Letalski prevoz";
  const location = [service.LocationName, service.RegionGroupName || service.RegionName].filter(Boolean).join(" / ") || (typeof sp.LocationName === "string" ? sp.LocationName : "") || "Turčija";

  const getFlightLines = (result: any) => {
    const fromInfo = (result?.Info || [])
      .map((line: string) => String(line).trim())
      .filter((line: string) => line.startsWith("=>") || line.startsWith("<="));

    if (fromInfo.length > 0) return fromInfo;

    const lines: string[] = [];
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
  };

  const flightLines = getFlightLines(verify);

  const flightRouteFallback = typeof sp.FlightRoute === "string" ? sp.FlightRoute : "";

  return (
    <main className="container page-shell">
      {verify.usingMock && <p className="mock-notice">Način z vzorčnimi podatki: {verify.error || verify.info || "Neznana napaka"}</p>}

      <section className="checkout-hero">
        <div className="checkout-hero-copy">
          <p className="eyebrow" style={{ color: "var(--c)", background: "rgba(139, 53, 63, 0.08)" }}>
            Zahtevek za rezervacijo
          </p>
          <h1>Zaključite rezervacijo z nekaj jasnimi koraki.</h1>
          <p>
            Vnesite kontaktne podatke, podatke potnikov in pošljite rezervacijski zahtevek.
            Povzetek ponudbe ostane ves čas viden na desni strani.
          </p>
        </div>
        <div className="checkout-hero-stats">
          <div className="checkout-hero-stat">
            <span>Potniki</span>
            <strong>{adultCount}</strong>
          </div>
          <div className="checkout-hero-stat">
            <span>Rezervacija</span>
            <strong>{total.toLocaleString("sl-SI", { style: "currency", currency: "EUR" })}</strong>
          </div>
        </div>
      </section>

      <form className="checkout-grid" action="/api/checkout" method="post">
        <input type="hidden" name="tourOperator" value={tourOperator} />
        <input type="hidden" name="hashCode" value={decodeURIComponent(hashCode)} />
        <input type="hidden" name="AdultCount" value={adultCount} />
        <section className="checkout-main">
          <div className="checkout-box checkout-box-accent">
            <div className="checkout-section-head">
              <div>
                <p className="checkout-kicker">Korak 1</p>
                <h2>Nosilec rezervacije</h2>
              </div>
              <p>Podatki osebe, s katero stopimo v stik glede rezervacije.</p>
            </div>

            <div className="checkout-choice-row">
              <label className="check-terms check-pill">
                <input type="radio" name="gender" value="m" defaultChecked />
                Gospod
              </label>
              <label className="check-terms check-pill">
                <input type="radio" name="gender" value="f" />
                Gospa
              </label>
            </div>

            <div className="field-grid checkout-field-grid">
              <div className="form-field"><label>Ime *</label><input name="name" /></div>
              <div className="form-field"><label>Priimek *</label><input name="surname" /></div>
              <div className="form-field form-field-wide"><label>Naslov *</label><input name="address" required /></div>
              <div className="form-field"><label>Pošta *</label><input name="zip" required /></div>
              <div className="form-field"><label>Kraj *</label><input name="city" required /></div>
              <div className="form-field"><label>E-naslov *</label><input name="email" type="email" /></div>
              <div className="form-field"><label>Telefon *</label><input name="phone" /></div>
            </div>
          </div>

          <div className="checkout-box">
            <div className="checkout-section-head">
              <div>
                <p className="checkout-kicker">Korak 2</p>
                <h2>Podatki o potnikih</h2>
              </div>
              <p>Za vsakega potnika vnesite osebne podatke, kot morajo biti zapisani na dokumentih.</p>
            </div>

            <div className="traveler-stack">
            {Array.from({ length: adultCount }).map((_, i) => (
              <div className="traveler-card" key={i}>
                <div className="traveler-card-head">
                  <span className="traveler-index">Potnik {i + 1}</span>
                  <span className="traveler-hint">obvezni podatki</span>
                </div>
                <div className="field-grid checkout-field-grid">
                  <div className="form-field"><label>Ime *</label><input name={`passengers[${i}][name]`} /></div>
                  <div className="form-field"><label>Priimek *</label><input name={`passengers[${i}][surname]`} /></div>
                  <div className="form-field"><label>Datum rojstva *</label><input placeholder="DD.MM.LLLL" name={`passengers[${i}][birthday]`} /></div>
                  <div className="form-field"><label>Spol *</label><select name={`passengers[${i}][gender]`}><option>M</option><option>Ž</option></select></div>
                </div>
              </div>
            ))}
            </div>
          </div>

          <div className="checkout-box">
            <div className="checkout-section-head">
              <div>
                <p className="checkout-kicker">Korak 3</p>
                <h2>Dodatne storitve in želje</h2>
              </div>
              <p>Izberite dodatne storitve in po želji dopišite opombe ali posebne zahteve za organizatorja.</p>
            </div>
            <CheckoutExtrasNote
              extraServices={extraServices}
              initialSelectedValues={initialSelectedExtraValues}
              showCheckboxes={false}
            />
          </div>

          <div className="checkout-box">
            <div className="checkout-section-head">
              <div>
                <p className="checkout-kicker">Korak 4</p>
                <h2>Zaščita potovanja</h2>
              </div>
              <p>Izberite dodatno zaščito, če želite rezervacijo dopolniti z zavarovanjem.</p>
            </div>
            <div className="choice-stack">
              <label className="check-terms choice-card"><input type="checkbox" /> Želim zavarovati aranžma za primer odpovedi.</label>
              <label className="check-terms choice-card"><input type="checkbox" /> Želim skleniti zdravstveno asistenco Coris.</label>
            </div>
          </div>

          <div className="checkout-box">
            <div className="checkout-section-head">
              <div>
                <p className="checkout-kicker">Zaključek</p>
                <h2>Potrditev pogojev</h2>
              </div>
              <p>Brez potrditve pogojev oddaja rezervacije ni mogoča.</p>
            </div>
            <label className="check-terms choice-card choice-card-strong">
              <input type="checkbox" name="terms" required />
              Skrbno sem prebral pogoje poslovanja in jih potrjujem.
            </label>
          </div>
        </section>

        <aside className="offer-box">
          <div className="offer-box-top">
            <p className="checkout-kicker">Povzetek ponudbe</p>
            <h2>{offerName.toUpperCase()}</h2>
            <p className="location">{location}</p>
          </div>

          <div className="offer-summary-cluster">
            {startDate && <div className="summary-line"><span>Odhod na destinacijo</span><b>{formatDate(startDate)}</b></div>}
            {endDate && <div className="summary-line"><span>Odhod iz destinacije</span><b>{formatDate(endDate)}</b></div>}
            {duration && <div className="summary-line"><span>Trajanje</span><b>{duration} dni</b></div>}
            <div className="summary-line"><span>Soba</span><b>{roomName}</b></div>
            <div className="summary-line"><span>Storitev</span><b>{serviceName}</b></div>
            <div className="summary-line">
              <span>Letalski prevoz</span>
              <b>
                {flightLines.length > 0 ? (
                  flightLines.join(" / ")
                ) : flightRouteFallback ? (
                  flightRouteFallback
                ) : (
                  "Urnik poletov še ni potrjen. Točne ure letov vam sporočimo ob potrditvi rezervacije."
                )}
              </b>
            </div>
          </div>

          <div className="offer-price-panel">
            <div className="summary-line"><span>Cena aranžmaja</span><b>{offerPrice.toLocaleString("sl-SI", { style: "currency", currency: "EUR" })}</b></div>
            <div className="summary-line"><span>Stroški rezervacije</span><b>{registrationFee.toLocaleString("sl-SI", { style: "currency", currency: "EUR" })}</b></div>
            <div className="summary-line summary-line-total">
              <span className="summary-total">Skupaj</span>
              <span className="summary-total">{total.toLocaleString("sl-SI", { style: "currency", currency: "EUR" })}</span>
            </div>
          </div>

          <button className="btn checkout-submit" type="submit">
            Pošlji rezervacijo
          </button>
          <p className="checkout-submit-note">
            Po oddaji bomo zahtevek poslali organizatorju in vas preusmerili na potrditev.
          </p>
        </aside>
      </form>
    </main>
  );
}
