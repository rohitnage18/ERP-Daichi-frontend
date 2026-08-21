import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${getApiBaseUrl().replace(/\/$/, "")}/stats`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Stats unavailable" }, { status: 503 });
    }
    const data = await res.json();
    const activeDealers = Number(data?.activeDealers);
    const products = Number(data?.products);
    if (!Number.isFinite(activeDealers) || !Number.isFinite(products)) {
      return NextResponse.json({ error: "Stats unavailable" }, { status: 503 });
    }
    return NextResponse.json(
      { activeDealers, products },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Stats unavailable" }, { status: 503 });
  }
}
