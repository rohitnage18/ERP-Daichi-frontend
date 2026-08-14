import { NextResponse } from "next/server";
import { apiUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

async function loadStats() {
  const res = await fetch(apiUrl("/api/public/stats"), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const activeDealers = Number(data?.activeDealers);
  const products = Number(data?.products);
  if (!Number.isFinite(activeDealers) || !Number.isFinite(products)) return null;
  return { activeDealers, products };
}

export async function GET() {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const stats = await loadStats();
      if (stats) return NextResponse.json(stats);
    } catch {
      // Render free tier may still be waking
    }
    await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
  }

  return NextResponse.json({ error: "Stats unavailable" }, { status: 503 });
}
