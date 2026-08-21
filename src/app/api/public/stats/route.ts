import { NextResponse } from "next/server";
import { apiUrl, getApiBaseUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

function parseStats(data: unknown): { activeDealers: number; products: number } | null {
  const body = data as { activeDealers?: number; products?: number };
  const activeDealers = Number(body?.activeDealers);
  const products = Number(body?.products);
  if (!Number.isFinite(activeDealers) || !Number.isFinite(products)) return null;
  return { activeDealers, products };
}

export async function GET() {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const urls = [`${base}/stats`, `${base}/health`, apiUrl("/api/public/stats")];

  for (let attempt = 0; attempt < 5; attempt++) {
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) continue;
        const stats = parseStats(await res.json());
        if (stats) {
          return NextResponse.json(stats, { headers: { "Cache-Control": "no-store" } });
        }
      } catch {
        // Render may still be waking
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }

  return NextResponse.json({ error: "Stats unavailable" }, { status: 503 });
}
