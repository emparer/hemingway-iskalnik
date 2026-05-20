//app/api/ors/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyOffer } from "@/lib/ors";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ages = (sp.get("Ages") || "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value));

  const data = await verifyOffer(
    sp.get("TourOperator") || "PALM",
    sp.get("HashCode") || "",
    Number(sp.get("AdultCount") || 2),
    ages
  );

  return NextResponse.json(data);
}
