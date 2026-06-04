//app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { registerOffer } from "@/lib/ors";

function slDateToIso(date: string) {
  const cleaned = date.trim();

  // already ISO: 2000-04-03
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // Slovenian: 03.04.2000
  const parts = cleaned.split(".").map(p => p.trim());

  const [d, m, y] = parts;

  if (!d || !m || !y) return cleaned;

  return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  console.log("========== CHECKOUT POST START ==========");

  const form = await req.formData();

  const tourOperator = String(form.get("tourOperator") || "");
  const hashCode = String(form.get("hashCode") || "");
  const adultCount = Number(form.get("AdultCount") || 2);

  console.log("[checkout] received identifiers:", {
    tourOperator,
    hashCode,
    adultCount,
  });

  if (!tourOperator || !hashCode) {
    console.error("[checkout] missing tourOperator or hashCode");
    return NextResponse.json(
      { ok: false, error: "Missing tourOperator or hashCode." },
      { status: 400 }
    );
  }

  const termsAccepted = form.get("terms") === "on";
  const selectedExtraServices = form
    .getAll("extraServices")
    .map(value => String(value).trim())
    .filter(Boolean);

  console.log("[checkout] terms accepted:", termsAccepted);

  if (!termsAccepted) {
    return NextResponse.json(
      { ok: false, error: "Pogoje poslovanja morate potrditi." },
      { status: 400 }
    );
  }

  const note = String(form.get("note") || "").trim();
  const extraServiceNotes = selectedExtraServices.length
    ? ["Izbrane dodatne storitve:", ...selectedExtraServices.map(service => `- ${service}`)].join("\n")
    : "";
  const comments = note.includes("Izbrane dodatne storitve:")
    ? note
    : [note, extraServiceNotes].filter(Boolean).join("\n\n");

  const travelers: Record<string, any> = {};

  for (let i = 0; i < adultCount; i++) {
    const firstName = String(form.get(`passengers[${i}][name]`) || "");
    const lastName = String(form.get(`passengers[${i}][surname]`) || "");
    const gender = String(form.get(`passengers[${i}][gender]`) || "M");
    const birthday = String(form.get(`passengers[${i}][birthday]`) || "");

    travelers[String(i + 1)] = {
      PassengerType: gender === "Ž" ? "F" : "H",
      FirstName: firstName,
      LastName: lastName,
      BirthDate: slDateToIso(birthday),
    };
  }

  const payload = {
    Language: "si",
    AdultCount: adultCount,

    Travelers: travelers,

    Comments: comments,

    Customer: {
      IsCompany: false,
      FirstName: String(form.get("name") || ""),
      LastName: String(form.get("surname") || ""),
      Address: String(form.get("address") || ""),
      ZIPCode: String(form.get("zip") || ""),
      City: String(form.get("city") || ""),
      Email: String(form.get("email") || ""),
      Telephone: String(form.get("phone") || ""),
      Mobile: String(form.get("phone") || ""),
      Sex: String(form.get("gender") || "m") === "f" ? "F" : "H",
      Locale: "sl_SI",
    },
  };

  console.log("[checkout] payload being sent to ORS:");
  console.dir(payload, { depth: null });

  try {
    const result = await registerOffer(tourOperator, hashCode, payload);

    console.log("[checkout] ORS register result:");
    console.dir(result, { depth: null });

    const successId =
      result.RequestID ||
      result.Operator?.RegistrationBookingCode ||
      result.Operator?.BookingCode ||
      result.Operator?.RemoteBookingCode ||
      "success";

    console.log("[checkout] redirecting to success:", successId);

    return NextResponse.redirect(
      new URL(`/checkout/success/${encodeURIComponent(successId)}`, req.url),
      303
    );
  } catch (err: any) {
    console.error("[checkout] ORS register failed:");
    console.error(err);

    return NextResponse.json(
      {
        ok: false,
        error: err.message || String(err),
      },
      { status: 500 }
    );
  }
}
