"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { apiFetchJsonArray } from "@/lib/api";

const purposeLabels: Record<string, string> = {
  ORDER_FOLLOWUP: "Order follow-up",
  COLLECTION: "Collection",
  NEW_DEALER: "New dealer",
  PRODUCT_DEMO: "Product demo",
  COMPLAINT: "Complaint",
  OTHER: "Other",
};

const claimLabels: Record<string, string> = {
  TRAVEL: "Travel / fuel",
  DA: "Daily allowance",
  FOOD: "Food",
  LODGING: "Lodging",
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
  const [logs, setLogs] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetchJsonArray("/api/daily-logs"),
      apiFetchJsonArray("/api/visits"),
      apiFetchJsonArray("/api/allowances"),
      apiFetchJsonArray("/api/location"),
    ])
      .then(([l, v, a, t]) => {
        if (cancelled) return;
        setLogs(l);
        setVisits(v);
        setAllowances(a);
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
        <p className="text-muted-foreground">Everything you submitted — logs, visits, claims, and GPS</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <Tabs defaultValue="logs">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
            <TabsTrigger value="visits">Visits ({visits.length})</TabsTrigger>
            <TabsTrigger value="allowances">Claims ({allowances.length})</TabsTrigger>
            <TabsTrigger value="location">GPS ({tracks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="mt-4 space-y-3">
            {logs.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No daily logs yet. Submit one from Daily work log.</p>
            ) : (
              logs.map((log) => (
                <Card key={log.id || log._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{formatDate(log.logDate)}</CardTitle>
                    <p className="text-xs text-muted-foreground">Saved {formatDateTime(log.updatedAt || log.createdAt)}</p>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>{log.summary}</p>
                    <Detail label="Dealers visited" value={log.dealersVisited} />
                    <Detail label="Orders discussed" value={log.ordersDiscussed} />
                    <Detail
                      label="Travel"
                      value={
                        log.kilometersTraveled != null
                          ? `${log.kilometersTraveled} km`
                          : log.openingKm != null || log.closingKm != null
                            ? `${log.openingKm ?? "—"} → ${log.closingKm ?? "—"} km`
                            : null
                      }
                    />
                    {log.salesAmount != null && <Detail label="Sales" value={formatCurrency(log.salesAmount)} />}
                    {log.collectionAmount != null && (
                      <Detail label="Collection" value={formatCurrency(log.collectionAmount)} />
                    )}
                    <Detail label="New dealers" value={log.newDealersAppointed} />
                    <Detail label="Notes" value={log.achievementNotes} />
                    <Detail label="Expenses" value={log.expensesSummary} />
                    {log.latitude != null && (
                      <p className="text-xs text-brand-600">
                        📍 {Number(log.latitude).toFixed(4)}, {Number(log.longitude).toFixed(4)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="visits" className="mt-4 space-y-3">
            {visits.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No dealer visits yet. Log one from Dealer visit.</p>
            ) : (
              visits.map((v) => (
                <Card key={v.id || v._id}>
                  <CardContent className="space-y-1 pt-4 text-sm">
                    <p className="font-medium">
                      {v.dealer?.firmName || v.dealerName || v.prospectName || "Visit"}
                    </p>
                    <p className="text-muted-foreground">
                      {formatDateTime(v.visitDate)} · {purposeLabels[v.purpose] || v.purpose}
                    </p>
                    <Detail label="Persons met" value={v.personsMet} />
                    <p className="mt-1">{v.discussionNotes}</p>
                    <Detail label="Next action" value={v.nextAction} />
                    {v.latitude != null && (
                      <p className="mt-1 text-xs text-brand-600">
                        📍 {Number(v.latitude).toFixed(4)}, {Number(v.longitude).toFixed(4)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="allowances" className="mt-4 space-y-3">
            {allowances.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No allowance claims yet. Submit one from Allowance claim.</p>
            ) : (
              allowances.map((c) => (
                <Card key={c.id || c._id}>
                  <CardContent className="flex items-start justify-between gap-4 pt-4">
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{claimLabels[c.claimType] || c.claimType}</p>
                      <p className="text-muted-foreground">{formatDateTime(c.claimDate || c.createdAt)}</p>
                      <p>{c.description}</p>
                      {c.kilometers != null && <Detail label="Kilometers" value={c.kilometers} />}
                      <Detail label="Receipt note" value={c.receiptNote} />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold">{formatCurrency(Number(c.amount) || 0)}</p>
                      <StatusBadge status={c.status} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="location" className="mt-4 space-y-3">
            {tracks.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No GPS points yet. Capture location on a visit, daily log, or claim.
              </p>
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
                    {t.addressLabel && <p className="text-muted-foreground">{t.addressLabel}</p>}
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
