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
  console.log("=== HOTEL DESTINATIONS ===");
  const hotels = await testQuery("/search/hotel/products", {
    Language: "si",
    StartDate: "26.06.2026",
    EndDate: "09.01.2027",
    AdultCount: 2,
    Count: 10
  });
  console.log("Found:", hotels.Count, "hotels.");
  if (hotels.Results) {
    hotels.Results.slice(0, 5).forEach(h => {
      console.log(`- ${h.Product?.OfferName} (${h.Product?.Location?.LocationName}, ${h.Product?.Location?.RegionName}, ${h.Product?.Location?.RegionGroupName}) RegionGroupID: ${h.Product?.Location?.RegionGroupID}`);
    });
  }

  console.log("\n=== TRIPS DESTINATIONS ===");
  const trips = await testQuery("/search/trips/products", {
    Language: "si",
    StartDate: "26.06.2026",
    EndDate: "09.01.2027",
    AdultCount: 2,
    Count: 10
  });
  console.log("Found:", trips.Count, "trips.");
  if (trips.Results) {
    trips.Results.slice(0, 5).forEach(t => {
      console.log(`- ${t.Product?.OfferName} (${t.Product?.Location?.LocationName}, ${t.Product?.Location?.RegionName}, ${t.Product?.Location?.RegionGroupName}) RegionGroupID: ${t.Product?.Location?.RegionGroupID}`);
    });
  }
}

run();
