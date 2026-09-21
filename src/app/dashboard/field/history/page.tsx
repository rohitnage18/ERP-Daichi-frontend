"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { apiFetchJsonArray } from "@/lib/api";

const purposeLabels: Record<string, string> = {
  ORDER_FOLLOWUP: "Order follow-up",
  COLLECTION: "Collection",
  NEW_DEALER: "New dealer",
  PRODUCT_DEMO: "Product demo",
  COMPLAINT: "Complaint",
  OTHER: "Other",
};

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <p>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </p>
  );
}

export default function FieldHistoryPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetchJsonArray("/api/daily-reports"),
      apiFetchJsonArray("/api/daily-logs"),
      apiFetchJsonArray("/api/visits"),
      apiFetchJsonArray("/api/location"),
    ])
      .then(([r, l, v, t]) => {
        if (cancelled) return;
        setReports(r);
        setLogs(l);
        setVisits(v);
        setTracks(t);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My field history</h1>
        <p className="text-muted-foreground">Plans, closings, visits, and GPS — kept date-wise</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <Tabs defaultValue="reports">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
            <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
            <TabsTrigger value="visits">Visits ({visits.length})</TabsTrigger>
            <TabsTrigger value="location">GPS ({tracks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="mt-4 space-y-3">
            {reports.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No daily reports yet.</p>
            ) : (
              reports.map((rep) => (
                <Card key={rep.id || rep._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{formatDate(rep.reportDate)}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-medium">Plan</p>
                      <Detail label="Sales target" value={rep.activity ? formatCurrency(rep.activity.salesTarget) : "Missing"} />
                      <Detail label="Collection target" value={rep.activity ? formatCurrency(rep.activity.collectionTarget) : null} />
                      <Detail label="Places" value={(rep.activity?.placesToVisit || []).join(", ")} />
                      {rep.activity?.submittedAt && (
                        <p className="text-xs text-muted-foreground">Submitted {formatDateTime(rep.activity.submittedAt)}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Actual</p>
                      <Detail label="Sales" value={rep.closing ? formatCurrency(rep.closing.salesAchievement) : "Not closed"} />
                      <Detail label="Collection" value={rep.closing ? formatCurrency(rep.closing.collectionAchievement) : null} />
                      <Detail label="Places" value={(rep.closing?.placesVisited || []).join(", ")} />
                      {rep.closing?.submittedAt && (
                        <p className="text-xs text-muted-foreground">Closed {formatDateTime(rep.closing.submittedAt)}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="logs" className="mt-4 space-y-3">
            {logs.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No daily logs yet.</p>
            ) : (
              logs.map((log) => (
                <Card key={log.id || log._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{formatDate(log.logDate)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>{log.summary}</p>
                    <Detail label="Dealers visited" value={log.dealersVisited} />
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="visits" className="mt-4 space-y-3">
            {visits.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No dealer visits yet.</p>
            ) : (
              visits.map((v) => (
                <Card key={v.id || v._id}>
                  <CardContent className="space-y-1 pt-4 text-sm">
                    <p className="font-medium">{v.dealer?.firmName || v.dealerName || v.prospectName || "Visit"}</p>
                    <p className="text-muted-foreground">
                      {formatDateTime(v.visitDate)} · {purposeLabels[v.purpose] || v.purpose}
                    </p>
                    <p className="mt-1">{v.discussionNotes}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="location" className="mt-4 space-y-3">
            {tracks.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No GPS points yet. Opt in on Field work to start tracking.</p>
            ) : (
              tracks.map((t) => (
                <Card key={t.id || t._id}>
                  <CardContent className="pt-4 text-sm">
                    <p>
                      {formatDateTime(t.recordedAt)} — {t.source}
                    </p>
                    <p className="font-mono text-xs">
                      {Number(t.latitude).toFixed(5)}, {Number(t.longitude).toFixed(5)}
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
