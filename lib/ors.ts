//lib/ors.ts

export const ORS_API_BASE =
  process.env.ORS_API_BASE ||
  (process.env.ORS_API_URL ? `${process.env.ORS_API_URL}/crs/v2` : "https://api.ors.si/crs/v2");
export const ORS_API_KEY  = process.env.ORS_API_KEY || "";
const ORS_LANGUAGE = "si";
const MAX_GLOBAL_SORT_RESULTS = 500;

type SearchParams = Record<string, any>;

type ProductResult = {
  MinPrice?: number;
  MinimumPrice?: number;
  OfferRating?: number;
  OverallRating?: number;
  Rating?: number;
  ProductRating?: number;
  Product?: {
    Category?: number;
    OfferRating?: number;
    OverallRating?: number;
    Rating?: number;
  };
};

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

function readOfferRating(item: ProductResult) {
  const raw = Number(
    item.Product?.OfferRating ??
    item.Product?.OverallRating ??
    item.Product?.Rating ??
    item.OfferRating ??
    item.OverallRating ??
    item.Rating ??
    item.ProductRating ??
    0
  );

  return raw > 10 ? raw / 10 : raw;
}

function sortByBestRating(results: ProductResult[]) {
  return [...results].sort((a, b) => {
    const aRating = readOfferRating(a);
    const bRating = readOfferRating(b);

    if (aRating === 0 && bRating > 0) return 1;
    if (bRating === 0 && aRating > 0) return -1;
    if (bRating !== aRating) return bRating - aRating;

    const aPrice = Number(a.MinimumPrice ?? a.MinPrice ?? 0);
    const bPrice = Number(b.MinimumPrice ?? b.MinPrice ?? 0);
    return aPrice - bPrice;
  });
}

function buildSearchPayload(params: SearchParams) {
  function toArray(val: any): any[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.includes(",")) return val.split(",");
    return [val];
  }

  const payload: Record<string, any> = {
    Language: params.Language || "si",
    StartDate: params.StartDate || "19.05.2026",
    EndDate: params.EndDate || "18.05.2027",
    AdultCount: toNumberIfPossible(params.AdultCount || 2),
    Page: toNumberIfPossible(params.Page || 0),
    Count: toNumberIfPossible(params.PageSize || params.Count || 12),
  };

  if (params.ChildCount !== undefined && params.ChildCount !== "") {
    payload.ChildCount = toNumberIfPossible(params.ChildCount);
  }
  if (params.Ages) {
    payload.Ages = toArray(params.Ages).map(Number);
  }

  if (params.TourOperator) payload.TourOperator = params.TourOperator;
  if (params.RegionGroup) payload.RegionGroup = toNumberIfPossible(params.RegionGroup);
  if (params.Region) payload.Region = toNumberIfPossible(params.Region);
  if (params.Location) payload.Location = toNumberIfPossible(params.Location);
  if (params.GiataID) payload.GiataID = toNumberIfPossible(params.GiataID);
  if (params.ProductName) payload.ProductName = params.ProductName;
  if (params.SubType) payload.SubType = params.SubType;
  
  const searchType = params.type || "pauschal";
  if (searchType === "pauschal") {
    const airports = params.DepartureAirport || params.DepartureAirports || params["DepartureAirports[]"] || params["DepartureAirport[]"];
    if (airports) {
      payload.DepartureAirport = toArray(airports);
    }
  }

  // Duration handling (split "7-9" into MinDuration/MaxDuration)
  if (params.Duration) {
    const parts = String(params.Duration).split("-");
    if (parts.length === 2) {
      payload.MinDuration = toNumberIfPossible(parts[0]);
      payload.MaxDuration = toNumberIfPossible(parts[1]);
    } else {
      payload.MinDuration = toNumberIfPossible(params.Duration);
      payload.MaxDuration = toNumberIfPossible(params.Duration);
    }
  }

  // Filters (Nested)
  const filters: Record<string, any> = {};
  
  // Handle MinCategory from SearchBox
  if (params.MinCategory) {
    const min = Number(params.MinCategory);
    filters.Category = Array.from({ length: 6 - min }, (_, i) => min + i);
  }

  // Handle ServiceCodes from SearchBox
  const serviceCodes = params.ServiceCodes || params["ServiceCodes[]"];
  if (serviceCodes) {
    filters.ServiceType = toArray(serviceCodes);
  }

  // Handle standard filters from Filters component
  if (params["Filter[Category][]"]) {
    filters.Category = toArray(params["Filter[Category][]"]).map(Number);
  }
  if (params["Filter[ServiceType][]"]) {
    filters.ServiceType = toArray(params["Filter[ServiceType][]"]);
  }
  if (params["Filter[RoomType][]"]) {
    filters.RoomType = toArray(params["Filter[RoomType][]"]);
  }
  if (params["Filter[Region][]"]) {
    filters.Region = toArray(params["Filter[Region][]"]);
  }
  if (params["Filter[Location][]"]) {
    filters.Location = toArray(params["Filter[Location][]"]);
  }
  
  if (Object.keys(filters).length > 0) {
    payload.Filter = filters;
  }

  // Handle RFilter[Price] (Slovene filters sidebar price slider)
  if (params["RFilter[Price]"]) {
    const parts = String(params["RFilter[Price]"]).split(",");
    if (parts.length === 2) {
      const min = toNumberIfPossible(parts[0].trim());
      const max = toNumberIfPossible(parts[1].trim());
      if (min !== undefined || max !== undefined) {
        payload.RFilter = {
          Price: {
            Minimum: min,
            Maximum: max,
          },
        };
      }
    }
  }

  // Sorting
  if (params.SortField) {
    const apiField = params.SortField;
    const apiOrder = String(params.SortDir || "asc").toLowerCase().startsWith("desc") ? "desc" : "asc";
    payload.Sort = [{
      [apiField]: apiOrder
    }];
  }

  return cleanObject(payload);
}

export async function orsPost(path: string, payload: Record<string, any>) {
  if (!ORS_API_KEY) {
    throw new Error("ORS_API_KEY missing. Using mock data.");
  }

  console.log("[ors] POST", path, JSON.stringify(payload));

  const res = await fetch(`${ORS_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "X-Api-Key": ORS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Language": ORS_LANGUAGE,
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

async function searchProductsSortedByRating(type: string, params: SearchParams) {
  const requestedPage = Number(params.Page || 0);
  const perPage = Number(params.PageSize || params.Count || 12);
  const basePayload = buildSearchPayload({
    ...params,
    Page: 0,
    Count: 1,
  });

  const meta = await orsPost(`/search/${type}/products`, basePayload);
  const total = Math.min(Number(meta.Count || 0), MAX_GLOBAL_SORT_RESULTS);

  const fullPayload = buildSearchPayload({
    ...params,
    Page: 0,
    Count: total > 0 ? total : perPage,
  });

  const fullData = await orsPost(`/search/${type}/products`, fullPayload);
  const allResults = Array.isArray(fullData.Results) ? fullData.Results : [];
  const sortedResults = sortByBestRating(allResults);
  const pages = Math.max(1, Math.ceil(sortedResults.length / perPage));
  const start = requestedPage * perPage;
  const end = start + perPage;

  return {
    ...fullData,
    Count: sortedResults.length,
    Pages: pages,
    Page: requestedPage,
    Results: sortedResults.slice(start, end),
  };
}

export async function searchProducts(params: SearchParams) {
  const type = params.type || "pauschal";
  const sortField = String(params.SortField || "Price");

  try {
    if (sortField === "OverallRating") {
      return await searchProductsSortedByRating(type, params);
    }

    return await orsPost(`/search/${type}/products`, buildSearchPayload(params));
  } catch (e: any) {
    return { ...dynamicMockSearchResults(params), usingMock: true, error: e.message || String(e) };
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


export async function verifyOffer(tourOperator: string, hashCode: string, adultCount: number, childCount: number = 0, ages: number[] = []) {
  try {
    return await orsPost(`/offer/${tourOperator}/${encodeURIComponent(hashCode)}/verify`, {
      AdultCount: adultCount,
      ChildCount: childCount,
      Ages: ages,
    });
  } catch (e: any) {
    return { ...mockVerify(), usingMock: true, error: e.message || String(e) };
  }
}

export async function getProductInfo(params: {
  GiataID: string | number;
  TourOperator: string;
  StartDate?: string;
}) {
  const { GiataID, TourOperator, StartDate } = params;

  if (!ORS_API_KEY) {
    throw new Error("ORS_API_KEY missing. Cannot fetch product info.");
  }

  const qs = StartDate
    ? `?date=${encodeURIComponent(StartDate)}`
    : "";

  const path =
    `/info/product/by-gid/${encodeURIComponent(String(GiataID))}` +
    `/${encodeURIComponent(TourOperator)}` +
    qs;

  console.log("[ors] product info URL:", `${ORS_API_BASE}${path}`);

  const res = await fetch(`${ORS_API_BASE}${path}`, {
    method: "GET",
    headers: {
      "X-Api-Key": ORS_API_KEY,
      Accept: "application/json",
      "Accept-Language": ORS_LANGUAGE,
    },
    cache: "no-store",
  });

  const text = await res.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  console.log("[ors] product info status:", res.status);
  console.log("[ors] product info raw response:", text.slice(0, 3000));

  if (!res.ok) {
    throw new Error(`ORS product info failed ${res.status}: ${text.slice(0, 1000)}`);
  }

  return data;
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
      "Accept-Language": ORS_LANGUAGE,
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

function dynamicMockSearchResults(params: SearchParams) {
  const allItems = [
    { name: "Bertran Park", giata: "6222", img: "https://cdn.ors.si/medium/6222_s.jpg", price: 659, cat: 4, rating: 10, city: "Lloret de Mar", region: "Costa Brava", locId: "2485", regId: "704" },
    { name: "Aqua Aquamarina & Spa", giata: "6277", img: "https://cdn.ors.si/medium/6277_s.jpg", price: 699, cat: 4, rating: 9, city: "Santa Susanna", region: "Costa Brava", locId: "10782", regId: "704" },
    { name: "Riviera", giata: "49270", img: "https://cdn.ors.si/medium/49270_s.jpg", price: 679, cat: 4, rating: 6, city: "Santa Susanna", region: "Costa Brava", locId: "10782", regId: "704" },
    { name: "Rosa Nàutica", giata: "6237", img: "https://cdn.ors.si/medium/6237_s.jpg", price: 739, cat: 3, rating: 10, city: "Malgrat de Mar", region: "Costa Brava", locId: "2488", regId: "704" },
    { name: "Aqua Promenade & Spa", giata: "19489", img: "https://cdn.ors.si/medium/19489_s.jpg", price: 699, cat: 4, rating: 9, city: "Pineda de Mar", region: "Costa Brava", locId: "2490", regId: "704" },
    { name: "Reymar Playa", giata: "51358", img: "https://cdn.ors.si/medium/51358_s.jpg", price: 759, cat: 3, rating: 8, city: "Malgrat de Mar", region: "Costa Brava", locId: "2488", regId: "704" },
    { name: "Hotel Reymar", giata: "6283", img: "https://cdn.ors.si/medium/6283_s.jpg", price: 759, cat: 3, rating: 5, city: "Malgrat de Mar", region: "Costa Brava", locId: "2488", regId: "704" },
    { name: "Alegria Fenals Mar", giata: "21171", img: "https://cdn.ors.si/medium/21171_s.jpg", price: 769, cat: 3, rating: 5, city: "Lloret de Mar", region: "Costa Brava", locId: "2485", regId: "704" },
    { name: "Fenals Garden", giata: "41676", img: "https://cdn.ors.si/medium/41676_s.jpg", price: 769, cat: 4, rating: 4, city: "Lloret de Mar", region: "Costa Brava", locId: "2485", regId: "704" },
  ];

  let filtered = [...allItems];

  // Filtering
  const cats = params["Filter[Category][]"] ? (Array.isArray(params["Filter[Category][]"]) ? params["Filter[Category][]"] : [params["Filter[Category][]"]]).map(Number) : [];
  if (cats.length > 0) {
    filtered = filtered.filter(i => cats.includes(i.cat));
  }

  const locs = params["Filter[Location][]"] ? (Array.isArray(params["Filter[Location][]"]) ? params["Filter[Location][]"] : [params["Filter[Location][]"]]) : [];
  if (locs.length > 0) {
    filtered = filtered.filter(i => locs.includes(i.locId));
  }

  const regs = params["Filter[Region][]"] ? (Array.isArray(params["Filter[Region][]"]) ? params["Filter[Region][]"] : [params["Filter[Region][]"]]) : [];
  if (regs.length > 0) {
    filtered = filtered.filter(i => regs.includes(i.regId));
  }

  // Sorting
  const sortField = params.SortField || "Price";
  const sortDir = params.SortDir || "asc";
  const mult = sortDir === "asc" ? 1 : -1;

  filtered.sort((a, b) => {
    if (sortField === "Price") return (a.price - b.price) * mult;
    if (sortField === "OverallRating") return (a.rating - b.rating) * mult;
    if (sortField === "Category") return (a.cat - b.cat) * mult;
    return 0;
  });

  // Pagination
  const page = toNumberIfPossible(params.Page || 0) as number;
  const perPage = toNumberIfPossible(params.PageSize || params.Count || 12) as number;
  const count = filtered.length;
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  return {
    Count: count,
    PerPage: perPage,
    RFilters: { Price: { Minimum: 369, Maximum: 1199 } },
    Results: paged.map(i => ({
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
