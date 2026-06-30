const fs = require('fs');
const path = require('path');

// Manually parse .env
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const ORS_API_KEY = env.ORS_API_KEY;
const ORS_API_URL = env.ORS_API_URL || "https://api.ors.si";

async function testQuery(path, payload) {
  const url = `${ORS_API_URL}/crs/v2${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Api-Key": ORS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Language": "si"
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data;
}

async function run() {
  console.log("=== HOTEL DATES ===");
  // Fetch a hotel GiataID first
  const hotels = await testQuery("/search/hotel/products", {
    Language: "si", StartDate: "26.06.2026", EndDate: "09.01.2027", AdultCount: 2, Count: 1
  });
  const hotelGiata = hotels.Results?.[0]?.Product?.GiataID;
  console.log("Hotel GiataID:", hotelGiata);

  if (hotelGiata) {
    const dates = await testQuery("/search/hotel/dates", {
      Language: "si", StartDate: "26.06.2026", EndDate: "09.01.2027", AdultCount: 2, GiataID: Number(hotelGiata), Count: 2
    });
    console.log("Hotel Date sample:");
    console.dir(dates.Dates?.[0], { depth: null });
  }

  console.log("\n=== TRIPS DATES ===");
  // Fetch a trip GiataID first
  const trips = await testQuery("/search/trips/products", {
    Language: "si", StartDate: "26.06.2026", EndDate: "09.01.2027", AdultCount: 2, Count: 1
  });
  const tripGiata = trips.Results?.[0]?.Product?.GiataID;
  console.log("Trip GiataID:", tripGiata);

  if (tripGiata) {
    const dates = await testQuery("/search/trips/dates", {
      Language: "si", StartDate: "26.06.2026", EndDate: "09.01.2027", AdultCount: 2, GiataID: Number(tripGiata), Count: 2
    });
    console.log("Trip Date sample:");
    console.dir(dates.Dates?.[0], { depth: null });
  }
}

run();
