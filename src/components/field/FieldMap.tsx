"use client";

import { useEffect, useRef } from "react";

export type MapPoint = {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
};

type Props = {
  points: MapPoint[];
  trail?: boolean;
  height?: number;
};

/**
 * Lightweight OSM map (no extra npm map SDK). Loads Leaflet from CDN only when rendered.
 */
export function FieldMap({ points, trail = false, height = 360 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || points.length === 0) return;
    let map: any;
    let cancelled = false;

    const cssId = "leaflet-cdn-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const start = async () => {
      const L = await loadLeaflet();
      if (cancelled || !ref.current) return;
      map = L.map(ref.current).setView([points[0].lat, points[0].lng], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);
      points.forEach((p, i) => {
        L.circleMarker([p.lat, p.lng], {
          radius: i === points.length - 1 ? 8 : 5,
          color: p.color || "#047857",
          fillOpacity: 0.85,
        })
          .addTo(map)
          .bindPopup(p.label || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`);
      });
      if (trail && latlngs.length > 1) {
        L.polyline(latlngs, { color: "#047857", weight: 3 }).addTo(map);
      }
      map.fitBounds(latlngs, { padding: [24, 24], maxZoom: 14 });
    };

    void start();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points, trail]);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground" style={{ height }}>
        No location points yet
      </div>
    );
  }

  return <div ref={ref} className="overflow-hidden rounded-lg border" style={{ height }} />;
}

function loadLeaflet(): Promise<any> {
  const w = window as typeof window & { L?: any };
  if (w.L) return Promise.resolve(w.L);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("leaflet-cdn-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).L));
      return;
    }
    const script = document.createElement("script");
    script.id = "leaflet-cdn-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve((window as any).L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
