//lib/ors.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const ORS_API_BASE =
  process.env.ORS_API_BASE ||
  (process.env.ORS_API_URL ? `${process.env.ORS_API_URL}/crs/v2` : "https://api.ors.si/crs/v2");
const ORS_API_KEY  = process.env.ORS_API_KEY || "";
const execFileAsync = promisify(execFile);

type SearchParams = Record<string, any>;

function cleanObject(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== "" && v !== null)
  );
}

function toNumberIfPossible(v: any) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

function buildSearchPayload(params: SearchParams) {
  const payload: Record<string, any> = {
    StartDate: params.StartDate || "19.05.2026",
    EndDate: params.EndDate || "18.05.2027",
    AdultCount: toNumberIfPossible(params.AdultCount || 2),
    Count: toNumberIfPossible(params.PageSize || params.Count || 12),
    Page: toNumberIfPossible(params.Page || 0),
  };

  if (params.RegionGroup) payload.RegionGroup = toNumberIfPossible(params.RegionGroup);
  if (params.Region) payload.Region = toNumberIfPossible(params.Region);
  if (params.Location) payload.Location = toNumberIfPossible(params.Location);
  if (params.GiataID) payload.GiataID = toNumberIfPossible(params.GiataID);
  if (params.Duration) payload.Duration = params.Duration;
  if (params.ServiceType) payload.ServiceType = params.ServiceType;
  if (params.MinimumCategory) payload.MinimumCategory = toNumberIfPossible(params.MinimumCategory);
  if (params.ProductName) payload.ProductName = params.ProductName;

  const filterKeys = [
    "Filter[Category][]",
    "Filter[ServiceType][]",
    "Filter[RoomType][]",
    "Filter[Region][]",
    "Filter[Location][]",
    "RFilter[Price]",
  ];

  for (const key of filterKeys) {
    if (params[key]) payload[key] = params[key];
  }

  if (params.SortField) {
    payload.SortField = params.SortField;
    payload.SortDir = params.SortDir || "asc";
  }

  return cleanObject(payload);
}

async function orsPost(path: string, payload: Record<string, any>) {
  if (!ORS_API_KEY) {
    throw new Error("ORS_API_KEY missing. Using mock data.");
  }

  const res = await fetch(`${ORS_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "X-Api-Key": ORS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ORS ${res.status}: ${text.slice(0, 500)}`);
  }

  return res.json();
}

export async function searchProducts(params: SearchParams) {
  const type = params.type || "pauschal";

  try {
    return await orsPost(`/search/${type}/products`, buildSearchPayload(params));
  } catch (e: any) {
    return { ...mockSearchResults(), usingMock: true, error: e.message || String(e) };
  }
}

export async function searchDates(params: SearchParams) {
  const type = params.type || "pauschal";

  try {
    return await orsPost(`/search/${type}/dates`, buildSearchPayload(params));
  } catch (e: any) {
    return { ...mockDatesResult(params.GiataID), usingMock: true, error: e.message || String(e) };
  }
}

export async function quickSearch(query: string, type = "any") {
  try {
    const data = await orsPost(`/search/${type}/quicksearch`, { Query: query });

    if (data?.Results) {
      return data;
    }

    // ORS quicksearch sometimes returns only RequestID for Node fetch, while
    // the same request via curl returns full results. Fall back narrowly here.
    const { stdout } = await execFileAsync("curl", [
      "-s",
      "-X",
      "POST",
      `${ORS_API_BASE}/search/${type}/quicksearch`,
      "-H",
      `X-Api-Key: ${ORS_API_KEY}`,
      "-H",
      "Content-Type: application/json",
      "-d",
      JSON.stringify({ Query: query }),
    ]);

    return JSON.parse(stdout);
  } catch (e: any) {
    return { Results: {}, usingMock: true, error: e.message || String(e) };
  }
}

export async function verifyOffer(tourOperator: string, hashCode: string, adultCount: number) {
  try {
    return await orsPost(`/offer/${tourOperator}/${encodeURIComponent(hashCode)}/verify`, {
      AdultCount: adultCount,
    });
  } catch (e: any) {
    return { ...mockVerify(), usingMock: true, info: e.message || String(e) };
  }
}

export async function registerOffer(
  tourOperator: string,
  hashCode: string,
  payload: Record<string, any>
) {
  if (!ORS_API_KEY) {
    throw new Error("ORS_API_KEY missing. Cannot send registration.");
  }

  const test = process.env.ORS_REGISTER_TEST === "true";

  const url =
    `${ORS_API_BASE}/offer/${encodeURIComponent(tourOperator)}/${encodeURIComponent(hashCode)}/register` +
    (test ? "?test=true" : "");

  console.log("[ors] register URL:", url);
  console.log("[ors] register payload:");
  console.dir(payload, { depth: null });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Api-Key": ORS_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await res.text();

  console.log("[ors] register status:", res.status);
  console.log("[ors] register raw response:", text);

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`ORS register failed ${res.status}: ${text.slice(0, 1000)}`);
  }

  // Important: ORS can return HTTP 200 but still contain an error
  if (data.errorCode && Number(data.errorCode) !== 0) {
    throw new Error(`ORS register error ${data.errorCode}: ${data.error || text}`);
  }

  if (data.error) {
    throw new Error(`ORS register error: ${data.error}`);
  }

  return data;
}

function mockSearchResults() {
  const items = [
    { name: "Bertran Park", giata: "6222", img: "https://cdn.ors.si/medium/6222_s.jpg", price: 659, cat: 4, rating: 10, city: "Lloret de Mar", region: "Costa Brava" },
    { name: "Aqua Aquamarina & Spa", giata: "6277", img: "https://cdn.ors.si/medium/6277_s.jpg", price: 699, cat: 4, rating: 9, city: "Santa Susanna", region: "Costa Brava" },
    { name: "Riviera", giata: "49270", img: "https://cdn.ors.si/medium/49270_s.jpg", price: 679, cat: 4, rating: 6, city: "Santa Susanna", region: "Costa Brava" },
    { name: "Rosa Nàutica", giata: "6237", img: "https://cdn.ors.si/medium/6237_s.jpg", price: 739, cat: 3, rating: 10, city: "Malgrat de Mar", region: "Costa Brava" },
    { name: "Aqua Promenade & Spa", giata: "19489", img: "https://cdn.ors.si/medium/19489_s.jpg", price: 699, cat: 4, rating: 9, city: "Pineda de Mar", region: "Costa Brava" },
    { name: "Reymar Playa", giata: "51358", img: "https://cdn.ors.si/medium/51358_s.jpg", price: 759, cat: 3, rating: 8, city: "Malgrat de Mar", region: "Costa Brava" },
    { name: "Hotel Reymar", giata: "6283", img: "https://cdn.ors.si/medium/6283_s.jpg", price: 759, cat: 3, rating: 5, city: "Malgrat de Mar", region: "Costa Brava" },
    { name: "Alegria Fenals Mar", giata: "21171", img: "https://cdn.ors.si/medium/21171_s.jpg", price: 769, cat: 3, rating: 5, city: "Lloret de Mar", region: "Costa Brava" },
    { name: "Fenals Garden", giata: "41676", img: "https://cdn.ors.si/medium/41676_s.jpg", price: 769, cat: 4, rating: 4, city: "Lloret de Mar", region: "Costa Brava" },
  ];

  return {
    Count: items.length,
    PerPage: 12,
    RFilters: { Price: { Minimum: 369, Maximum: 1199 } },
    Results: items.map(i => ({
      TourOperator: "PALH",
      MinPrice: i.price,
      MinimumPrice: i.price,
      Product: {
        GiataID: i.giata,
        OfferName: i.name,
        Category: i.cat,
        OverallRating: i.rating,
        Picture: { Full: i.img, Thumbnail: i.img },
        Location: {
          LocationName: i.city,
          RegionGroupName: "Španija (celina)",
          RegionName: i.region,
          RegionGroupID: 119,
        },
      },
    })),
    Filters: {
      Regions: [
        { ID: "100027", Name: "Barcelona z okolico" },
        { ID: "704", Name: "Costa Brava" },
        { ID: "708", Name: "Costa Dorada" },
      ],
      Cities: [
        { ID: "587", Name: "Barcelona" },
        { ID: "2486", Name: "Blanes" },
        { ID: "2490", Name: "Calella" },
        { ID: "2485", Name: "Lloret de Mar" },
        { ID: "2488", Name: "Malgrat de Mar" },
        { ID: "10782", Name: "Santa Susanna" },
      ],
      PriceMin: 369,
      PriceMax: 1199,
    },
  };
}

function mockDatesResult(giataId?: string) {
  return {
    Results: [{
      Product: {
        GiataID: giataId || "mock",
        OfferName: "Letalski prevoz Turčija - Antalya",
        Category: 0,
        OverallRating: 0,
        Picture: {
          Full: "https://api.bookinitsystem.com/subagents_api_pic/7cf5bbb65f9534658ef8d1d9dffaa895.JPEG",
          Thumbnail: "https://api.bookinitsystem.com/subagents_api_pic/7cf5bbb65f9534658ef8d1d9dffaa895_c150x150.JPEG",
        },
        Pictures: [
          { Full: "https://api.bookinitsystem.com/subagents_api_pic/7cf5bbb65f9534658ef8d1d9dffaa895.JPEG" },
          { Full: "https://api.bookinitsystem.com/subagents_api_pic/3ab8f1c3716c9307fab2683fbf215756.JPEG" },
          { Full: "https://api.bookinitsystem.com/subagents_api_pic/fc20f3e5361be6a8c08a6726f0c483bb.JPEG" },
          { Full: "https://api.bookinitsystem.com/subagents_api_pic/71ceb21f5187901d94abcb2447ccb736.JPEG" },
        ],
        Location: {
          LocationName: "Antalya",
          RegionGroupName: "Turčija",
          RegionName: "Antalya z okolico",
          RegionGroupID: 724,
        },
        Description: `<p><strong>Cena vključuje:</strong> povraten let v izbran kraj, letališke in varnostne pristojbine, 20 kg oddane prtljage, 5 kg ročne prtljage, prigrizek in napitek med poletom, predstavnika agencije Palma v informacijski poslovalnici na letališču.</p>
<p><strong>OTROCI:</strong> otroci do 2. leta potujejo na čarterskih poletih brezplačno.</p>`,
      },
    }],
    Dates: [
      { StartDate: "28.05.2026", EndDate: "04.06.2026", Duration: 7, RoomName: "brez namestitve", ServiceName: "samo prevoz", Price: 1118, TourOperator: "PALM", HashCode: "aba4acd1e7e47113676c3eecf5affb3d:1779926400:7", FlightRoute: "Ljubljana - Antalya - Ljubljana" },
      { StartDate: "04.06.2026", EndDate: "11.06.2026", Duration: 7, RoomName: "brez namestitve", ServiceName: "samo prevoz", Price: 1098, TourOperator: "PALM", HashCode: "mock:1:7", FlightRoute: "Ljubljana - Antalya - Ljubljana" },
      { StartDate: "11.06.2026", EndDate: "18.06.2026", Duration: 7, RoomName: "brez namestitve", ServiceName: "samo prevoz", Price: 1149, TourOperator: "PALM", HashCode: "mock:2:7", FlightRoute: "Ljubljana - Antalya - Ljubljana" },
    ],
  };
}

function mockVerify() {
  return { Price: 1118, Available: true, HashCode: "verified-mock", TourOperator: "PALM" };
}
