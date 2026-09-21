"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { dateKeyIST } from "@/lib/dates-ist";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TeamFieldPage() {
  const [date, setDate] = useState(dateKeyIST());
  const [userId, setUserId] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/users")
      .then((r) => r.json())
      .then((u) => setUsers(Array.isArray(u) ? u.filter((x: any) => x.role === "SALES_MARKETING") : []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("scope", "team");
    if (userId !== "all") params.set("userId", userId);
    params.set("from", `${date}T00:00:00.000+05:30`);
    params.set("to", `${date}T23:59:59.999+05:30`);
    const q = `?${params.toString()}`;
    Promise.all([
      apiFetch(`/api/daily-reports${q}`).then((r) => r.json()),
      apiFetch(`/api/visits${q}`).then((r) => r.json()),
    ])
      .then(([r, v]) => {
        setReports(Array.isArray(r) ? r : []);
        setVisits(Array.isArray(v) ? v : []);
      })
      .finally(() => setLoading(false));
  }, [date, userId]);

  const approveReport = async (id: string, section: "activity" | "closing") => {
    const res = await apiFetch(`/api/daily-reports/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, status: "APPROVED" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "Could not approve");
      return;
    }
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Team field activity</h1>
          <p className="text-muted-foreground">Daily plans vs actuals, visits, and GPS</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/field/tracking">Live map</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/reports/field">Plan vs actual</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <div className="space-y-2">
          <Label>Sales person</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All team</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily reports ({reports.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {reports.map((rep) => (
                <div key={rep.id} className="rounded-lg border p-3 text-sm space-y-2">
                  <p className="font-medium">{rep.salespersonName}</p>
                  <p className="text-muted-foreground">{formatDate(rep.reportDate)}</p>
                  {(rep.darId || rep.dcrId) && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {rep.darId || "—"} · {rep.dcrId || "—"}
                    </p>
                  )}
                  <p>
                    Sales {formatCurrency(rep.salesTarget || 0)} →{" "}
                    {rep.salesAchievement == null ? "—" : formatCurrency(rep.salesAchievement)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rep.hasActivity ? "Activity in" : "Missing activity"} · {rep.hasClosing ? "Closed" : "No closing"}
                    {rep.activityApproval?.status ? ` · DAR ${rep.activityApproval.status}` : ""}
                    {rep.closingApproval?.status ? ` · DCR ${rep.closingApproval.status}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rep.hasActivity && rep.activityApproval?.status !== "APPROVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void approveReport(rep.id, "activity")}
                      >
                        Approve DAR
                      </Button>
                    )}
                    {rep.hasClosing && rep.closingApproval?.status !== "APPROVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void approveReport(rep.id, "closing")}
                      >
                        Approve DCR
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {reports.length === 0 && <p className="text-muted-foreground text-sm">No reports</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visits ({visits.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {visits.map((v) => (
                <div key={v.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{v.user?.fullName}</p>
                  <p>
                    {v.dealer?.firmName || v.prospectName} — {v.purpose}
                  </p>
                  {v.latitude != null && (
                    <a
                      className="text-xs text-brand-600 underline"
                      href={`https://maps.google.com/?q=${v.latitude},${v.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on map
                    </a>
                  )}
                </div>
              ))}
              {visits.length === 0 && <p className="text-muted-foreground text-sm">No visits</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
