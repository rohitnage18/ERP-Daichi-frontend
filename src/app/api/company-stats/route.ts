import { NextResponse } from "next/server";
import { loadLoginStats } from "@/lib/login-stats";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await loadLoginStats();
    if (!stats) {
      return NextResponse.json({ error: "Stats unavailable" }, { status: 503 });
    }
    return NextResponse.json(
      {
        totalDealers: stats.totalDealers,
        activeDealers: stats.totalDealers,
        products: stats.products,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("company-stats", error);
    return NextResponse.json({ error: "Stats unavailable" }, { status: 503 });
  }
}
