//app/checkout/[tourOperator]/[hashCode]/page.tsx
import { verifyOffer } from "@/lib/ors";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ tourOperator: string; hashCode: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { tourOperator, hashCode } = await params;
  const sp = await searchParams;

  const adultCount = Number(sp.AdultCount || 2);
  const verify = await verifyOffer(tourOperator, decodeURIComponent(hashCode), adultCount);

  const offerPrice = Number(verify.Price || verify.TotalPrice || 1118);
  const registrationFee = 20;
  const total = offerPrice + registrationFee;

  return (
    <main className="container page-shell">
      {verify.usingMock && <p className="mock-notice">Mock mode: {verify.info}</p>}

      <form className="checkout-grid" action="/api/checkout" method="post">
        <input type="hidden" name="tourOperator" value={tourOperator} />
        <input type="hidden" name="hashCode" value={decodeURIComponent(hashCode)} />
        <input type="hidden" name="AdultCount" value={adultCount} />
        <section>
          <div className="checkout-box">
            <h2>Vaši podatki</h2>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 20 }}>
              <label className="check-terms">
                <input type="radio" name="gender" value="m" defaultChecked />
                Gospod
              </label>
              <label className="check-terms">
                <input type="radio" name="gender" value="f" />
                Gospa
              </label>
            </div>

            <div className="field-grid">
              <div><label>Ime *</label><input name="name" /></div>
              <div><label>Priimek *</label><input name="surname" /></div>
              <div><label>Naslov *</label><input name="address" required /></div>
              <div><label>Pošta *</label><input name="zip" required /></div>
              <div><label>Kraj *</label><input name="city" required /></div>
              <div><label>E-naslov *</label><input name="email" type="email" /></div>
              <div><label>Telefon *</label><input name="phone" /></div>
            </div>
          </div>

          <div className="checkout-box">
            <h2>Podatki o potnikih</h2>
            {Array.from({ length: adultCount }).map((_, i) => (
              <div className="field-grid" key={i} style={{ marginBottom: 14 }}>
                <div><label>{i + 1}. Potnik - Ime *</label><input name={`passengers[${i}][name]`} /></div>
                <div><label>Priimek *</label><input name={`passengers[${i}][surname]`} /></div>
                <div><label>Datum rojstva *</label><input placeholder="DD.MM.LLLL" name={`passengers[${i}][birthday]`} /></div>
                <div><label>Spol *</label><select name={`passengers[${i}][gender]`}><option>M</option><option>Ž</option></select></div>
              </div>
            ))}
          </div>

          <div className="checkout-box">
            <h2>Sporočilo organizatorju</h2>
            <textarea name="note" rows={4}></textarea>
          </div>

          <div className="checkout-box">
            <h2>Zavarovanje za odpoved aranžmaja</h2>
            <label className="check-terms"><input type="checkbox" /> Želim zavarovati aranžma za primer odpovedi.</label>
            <label className="check-terms"><input type="checkbox" /> Želim skleniti zdravstveno asistenco Coris.</label>
          </div>

          <div className="checkout-box">
            <h2>Pogoji poslovanja</h2>
            <label className="check-terms">

            <input type="checkbox" name="terms" required />

            Skrbno sem prebral pogoje poslovanja in jih potrjujem.

            </label>
          </div>
        </section>

        <aside className="offer-box">
          <h2>LETALSKI PREVOZ TURCIJA</h2>
          <p className="location">Antalya / Turčija / Antalya z okolico</p>
          <div className="summary-line"><span>Odhod na destinacijo</span><b>28.05.2026</b></div>
          <div className="summary-line"><span>Odhod iz destinacije</span><b>04.06.2026</b></div>
          <div className="summary-line"><span>Trajanje</span><b>7 dni</b></div>
          <div className="summary-line"><span>Soba</span><b>brez namestitve</b></div>
          <div className="summary-line"><span>Storitev</span><b>samo prevoz</b></div>
          <div className="summary-line"><span>Letalski prevoz</span><b>Ljubljana - Antalya - Ljubljana</b></div>
          <div className="summary-line"><span>Cena aranžmaja</span><b>{offerPrice.toLocaleString("sl-SI", { style: "currency", currency: "EUR" })}</b></div>
          <div className="summary-line"><span>Stroški rezervacije</span><b>{registrationFee.toLocaleString("sl-SI", { style: "currency", currency: "EUR" })}</b></div>
          <div className="summary-line">
            <span className="summary-total">Skupaj</span>
            <span className="summary-total">{total.toLocaleString("sl-SI", { style: "currency", currency: "EUR" })}</span>
          </div>
          <button className="btn" style={{ width: "100%", marginTop: 18 }} type="submit">
            Pošlji
          </button>
        </aside>
      </form>
    </main>
  );
}
