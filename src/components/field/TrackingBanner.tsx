"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useFieldTracking } from "@/hooks/useFieldTracking";
import { MapPin } from "lucide-react";

/**
 * Keeps GPS pings alive after opt-in across the dashboard, but only shows the
 * start/stop control on the Field work hub (/dashboard/field).
 */
export function TrackingBanner() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const { lastError, lastPingAt } = useFieldTracking(active);

  const showControls = pathname === "/dashboard/field";

  useEffect(() => {
    if (role !== "SALES_MARKETING") return;
    apiFetch("/api/location/session")
      .then((r) => r.json())
      .then((d) => setActive(Boolean(d.active)))
      .catch(() => undefined);
  }, [role]);

  if (role !== "SALES_MARKETING") return null;

  const toggle = async (next: boolean) => {
    setLoading(true);
    try {
      const path = next ? "/api/location/session/start" : "/api/location/session/stop";
      const res = await apiFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next ? { consent: true } : {}),
      });
      if (res.ok) setActive(next);
      else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not update tracking.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!showControls) return null;

  return (
    <div
      className={`mb-4 flex flex-col gap-2 rounded-lg border px-3 py-3 text-sm print:hidden sm:flex-row sm:items-center sm:justify-between ${
        active ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">{active ? "Location tracking is on" : "Location tracking is off"}</p>
          <p className="text-xs opacity-80">
            {active
              ? "Your position is shared with managers during working hours (9:00–20:00 IST), about every 30 minutes. Managers are alerted if there is no ping for 2+ hours."
              : "Tracking stays off until you opt in. It never runs in the background without this switch."}
          </p>
          {lastPingAt && active && (
            <p className="text-xs opacity-70">Last ping {new Date(lastPingAt).toLocaleTimeString("en-IN")}</p>
          )}
          {lastError && <p className="text-xs text-red-700">{lastError}</p>}
        </div>
      </div>
      <Button
        type="button"
        variant={active ? "outline" : "default"}
        className="h-10 shrink-0"
        disabled={loading}
        onClick={() => toggle(!active)}
      >
        {active ? "Stop tracking" : "Start tracking (opt in)"}
      </Button>
    </div>
  );
}
