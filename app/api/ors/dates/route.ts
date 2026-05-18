//app/api/ors/dates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchDates } from "@/lib/ors";

export async function GET(req: NextRequest) {
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const data = await searchDates(sp);
  return NextResponse.json(data);
}
