//app/api/ors/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyOffer } from "@/lib/ors";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const tourOperator = sp.get("TourOperator") || "";

  if (!tourOperator) {
    return NextResponse.json(
      { error: "TourOperator is required." },
      { status: 400 }
    );
  }

  const ages = (sp.get("Ages") || "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value));

  const childCount = Number(sp.get("ChildCount") || 0);

  const data = await verifyOffer(
    tourOperator,
    sp.get("HashCode") || "",
    Number(sp.get("AdultCount") || 2),
    childCount,
    ages
  );

  return NextResponse.json(data);
}
