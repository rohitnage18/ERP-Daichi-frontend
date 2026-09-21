"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { dateKeyIST } from "@/lib/dates-ist";
import { FieldMap } from "@/components/field/FieldMap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LivePoint = {
  userId: string;
  userName?: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
  trackingActive?: boolean;
  anomaly?: boolean;
};

type TrailPoint = { latitude: number; longitude: number; recordedAt: string; source?: string };

export default function FieldTrackingPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "MANAGEMENT_ADMIN";
  const [date, setDate] = useState(dateKeyIST());
  const [live, setLive] = useState<LivePoint[]>([]);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    apiFetch("/api/users")
      .then((r) => r.json())
      .then((u) =>
        setUsers(Array.isArray(u) ? u.filter((x: { role: string }) => x.role === "SALES_MARKETING") : [])
      );
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      apiFetch("/api/location/live")
        .then((r) => r.json())
        .then((d) => setLive(Array.isArray(d) ? d : []))
        .catch(() => setLive([]));
    }
  }, [isAdmin]);

  useEffect(() => {
    const params = new URLSearchParams({ date });
    if (isAdmin && userId) params.set("userId", userId);
    apiFetch(`/api/location/trail?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setTrail(Array.isArray(d) ? d : []))
      .catch(() => setTrail([]));
  }, [date, userId, isAdmin]);

  const livePoints = live.map((p) => ({
    lat: p.latitude,
    lng: p.longitude,
    label: `${p.userName || "Sales"} ${p.anomaly ? "(no ping 15+ min)" : ""}`,
    color: p.anomaly ? "#b91c1c" : "#047857",
  }));

  const trailPoints = trail.map((p) => ({
    lat: p.latitude,
    lng: p.longitude,
    label: `${p.source || "ping"} ${new Date(p.recordedAt).toLocaleTimeString("en-IN")}`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isAdmin ? "Live field tracking" : "My tracking"}</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Current locations and the day's route. Visible only to managers/admins."
            : "Your opted-in trail for the selected date."}
        </p>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Active salespeople</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldMap points={livePoints} height={380} />
            <div className="space-y-2 text-sm">
              {live.length === 0 && <p className="text-muted-foreground">No live pings yet today.</p>}
              {live.map((p) => (
                <div key={p.userId} className="flex items-center justify-between rounded border px-3 py-2">
                  <span>{p.userName}</span>
                  <span className={p.anomaly ? "text-red-600" : "text-emerald-700"}>
                    {p.anomaly ? "No ping 15+ min" : "Active"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Route / trail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label>Salesperson</Label>
                <Select value={userId || "me"} onValueChange={(v) => setUserId(v === "me" ? "" : v)}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">Me</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <FieldMap points={trailPoints} trail height={380} />
        </CardContent>
      </Card>
    </div>
  );
}
