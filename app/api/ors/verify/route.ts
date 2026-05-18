//app/api/ors/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyOffer } from "@/lib/ors";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const data = await verifyOffer(
    sp.get("TourOperator") || "PALM",
    sp.get("HashCode") || "",
    Number(sp.get("AdultCount") || 2)
  );

  return NextResponse.json(data);
}