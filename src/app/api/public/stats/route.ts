import { NextResponse } from "next/server";
import { apiUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = apiUrl("/api/public/stats");
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const activeDealers = Number(data?.activeDealers);
        const products = Number(data?.products);
        if (Number.isFinite(activeDealers) && Number.isFinite(products)) {
          return NextResponse.json(
            { activeDealers, products },
            { headers: { "Cache-Control": "no-store" } }
          );
        }
      }
    } catch {
      // Render may still be waking
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }

  return NextResponse.json({ error: "Stats unavailable" }, { status: 503 });
}
