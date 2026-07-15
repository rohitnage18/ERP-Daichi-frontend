"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { apiFetch } from "@/lib/api";

export default function FieldHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/daily-logs").then((r) => r.json()),
      apiFetch("/api/visits").then((r) => r.json()),
      apiFetch("/api/allowances").then((r) => r.json()),
      apiFetch(`/api/location?date=${new Date().toISOString().slice(0, 10)}`).then((r) =>
        r.json()
      ),
    ])
      .then(([l, v, a, t]) => {
        setLogs(Array.isArray(l) ? l : []);
        setVisits(Array.isArray(v) ? v : []);
        setAllowances(Array.isArray(a) ? a : []);
        setTracks(Array.isArray(t) ? t : []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/field">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">My field history</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <Tabs defaultValue="logs">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="visits">Visits</TabsTrigger>
            <TabsTrigger value="allowances">Claims</TabsTrigger>
            <TabsTrigger value="location">GPS</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-3 mt-4">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No daily logs yet.</p>
            ) : (
              logs.map((log) => (
                <Card key={log.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{formatDate(log.logDate)}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>{log.summary}</p>
                    <p className="text-muted-foreground">
                      {log.dealersVisited} dealers · {log.kilometersTraveled ?? "—"} km
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="visits" className="space-y-3 mt-4">
            {visits.map((v) => (
              <Card key={v.id}>
                <CardContent className="pt-4 text-sm">
                  <p className="font-medium">
                    {v.dealer?.firmName || v.prospectName || "Visit"} — {v.purpose}
                  </p>
                  <p className="text-muted-foreground">{formatDate(v.visitDate)}</p>
                  <p className="mt-1">{v.discussionNotes}</p>
                  {v.latitude != null && (
                    <p className="text-xs text-brand-600 mt-1">
                      📍 {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="allowances" className="space-y-3 mt-4">
            {allowances.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-4 flex justify-between items-start">
                  <div>
                    <p className="font-medium">{c.claimType}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(c.claimDate)}</p>
                    <p className="text-sm mt-1">{c.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(c.amount)}</p>
                    <StatusBadge status={c.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="location" className="space-y-3 mt-4">
            {tracks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No GPS points today. Capture location on a visit.
              </p>
            ) : (
              tracks.map((t) => (
                <Card key={t.id}>
                  <CardContent className="pt-4 text-sm">
                    <p>
                      {new Date(t.recordedAt).toLocaleTimeString("en-IN")} — {t.source}
                    </p>
                    <p className="font-mono text-xs">
                      {t.latitude.toFixed(5)}, {t.longitude.toFixed(5)}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
