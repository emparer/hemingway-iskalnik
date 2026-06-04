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
  const offerPrice =
    parsePriceValue(verify.Price?.TotalPrice) ??
    parsePriceValue(verify.Price?.PricePerPerson) ??
    parsePriceValue(verify.Price) ??
    parsePriceValue(verify.TotalPrice) ??
    parsePriceValue(verify.OfferPrice) ??
    parsePriceValue(verify.Total) ??
    1118;
  const registrationFee = 20;
  const total = offerPrice + registrationFee;
  const extraServices = Array.isArray(verify.ExtraServices) ? verify.ExtraServices : [];
  const initialSelectedExtraValues = Array.isArray(sp.extraServices)
    ? sp.extraServices.map(value => String(value))
    : sp.extraServices
      ? [String(sp.extraServices)]
      : [];

  return (
    <main className="container page-shell">
      {verify.usingMock && <p className="mock-notice">Način z vzorčnimi podatki: {verify.info}</p>}

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
            <h2>LETALSKI PREVOZ TURCIJA</h2>
            <p className="location">Antalya / Turčija / Antalya z okolico</p>
          </div>

          <div className="offer-summary-cluster">
            <div className="summary-line"><span>Odhod na destinacijo</span><b>28.05.2026</b></div>
            <div className="summary-line"><span>Odhod iz destinacije</span><b>04.06.2026</b></div>
            <div className="summary-line"><span>Trajanje</span><b>7 dni</b></div>
            <div className="summary-line"><span>Soba</span><b>brez namestitve</b></div>
            <div className="summary-line"><span>Storitev</span><b>samo prevoz</b></div>
            <div className="summary-line"><span>Letalski prevoz</span><b>Ljubljana - Antalya - Ljubljana</b></div>
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
