//app/api/ors/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/ors";

export async function GET(req: NextRequest) {
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const data = await searchProducts(sp);
  return NextResponse.json(data);
}
