"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

const INTERVAL_MS = 3 * 60 * 1000;

export function useFieldTracking(enabled: boolean) {
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastPingAt, setLastPingAt] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastSent = useRef(0);

  const sendPing = useCallback(async (coords: GeolocationCoordinates) => {
    const now = Date.now();
    if (now - lastSent.current < INTERVAL_MS - 5000) return;
    lastSent.current = now;
    const res = await apiFetch("/api/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        source: "LIVE_TRACK",
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setLastError(err.error || "Could not send location");
      return;
    }
    setLastError(null);
    setLastPingAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;

    const ping = (pos: GeolocationPosition) => {
      void sendPing(pos.coords);
    };

    navigator.geolocation.getCurrentPosition(ping, () => {
      setLastError("Allow location access to share your field position.");
    });

    watchId.current = navigator.geolocation.watchPosition(ping, () => undefined, {
      enableHighAccuracy: true,
      maximumAge: INTERVAL_MS,
      timeout: 20000,
    });

    const timer = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(ping, () => undefined, {
        enableHighAccuracy: true,
        timeout: 20000,
      });
    }, INTERVAL_MS);

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      window.clearInterval(timer);
    };
  }, [enabled, sendPing]);

  return { lastError, lastPingAt };
}
