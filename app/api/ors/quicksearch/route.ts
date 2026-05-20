import { NextRequest, NextResponse } from "next/server";
import { quickSearch } from "@/lib/ors-server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") || "";
  const type = req.nextUrl.searchParams.get("type") || "any";

  if (!query.trim()) {
    return NextResponse.json({ Results: { Products: [], Locations: [], Regions: [] } });
  }

  const data = await quickSearch(query, type);
  return NextResponse.json(data);
}
