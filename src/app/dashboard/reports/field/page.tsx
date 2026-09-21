"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";
import { dateKeyIST } from "@/lib/dates-ist";

type Row = {
  salespersonId: string;
  salespersonName: string;
  zoneName: string;
  reportDate: string;
  hasActivity: boolean;
  hasClosing: boolean;
  salesTarget: number | null;
  salesAchievement: number | null;
  collectionTarget: number | null;
  collectionAchievement: number | null;
  plannedPlaces: string[];
  actualPlaces: string[];
  missingActivity: boolean;
  missingClosing: boolean;
  closingWithoutActivity: boolean;
  activitySubmittedAt: string | null;
  closingSubmittedAt: string | null;
};

export default function FieldDailyReportsPage() {
  const today = dateKeyIST();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [userId, setUserId] = useState("all");
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/users")
      .then((r) => r.json())
      .then((u) => setUsers(Array.isArray(u) ? u.filter((x: { role: string }) => x.role === "SALES_MARKETING") : []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    if (userId !== "all") params.set("userId", userId);
    apiFetch(`/api/daily-reports/summary?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d.rows) ? d.rows : []))
      .finally(() => setLoading(false));
  }, [from, to, userId]);

  const exportCsv = () => {
    const header =
      "Date,Salesperson,Zone,Sales Target,Sales Actual,Collection Target,Collection Actual,Planned Places,Actual Places,Activity,Closing,Flags\n";
    const body = rows
      .map((r) => {
        const flags = [
          r.missingActivity ? "missing activity" : "",
          r.missingClosing ? "missing closing" : "",
          r.closingWithoutActivity ? "closing without activity" : "",
        ]
          .filter(Boolean)
          .join("; ");
        return [
          r.reportDate,
          r.salespersonName,
          r.zoneName,
          r.salesTarget ?? "",
          r.salesAchievement ?? "",
          r.collectionTarget ?? "",
          r.collectionAchievement ?? "",
          `"${(r.plannedPlaces || []).join("; ")}"`,
          `"${(r.actualPlaces || []).join("; ")}"`,
          r.hasActivity ? "Yes" : "No",
          r.hasClosing ? "Yes" : "No",
          `"${flags}"`,
        ].join(",");
      })
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-reports-${from}-to-${to}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Daily sales reports</h1>
          <p className="text-muted-foreground">Plan vs actual by salesperson and date. Historical archive is kept.</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label>From</Label>
          <Input type="date" className="w-44" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <Input type="date" className="w-44" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Salesperson</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-56">
              <SelectValue />
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

      <Card>
        <CardHeader>
          <CardTitle>{loading ? "Loading…" : `${rows.length} day-rows`}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead className="text-right">Sales plan / actual</TableHead>
                <TableHead className="text-right">Collection plan / actual</TableHead>
                <TableHead>Visits plan / actual</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.salespersonId}-${r.reportDate}`}>
                  <TableCell>{r.reportDate}</TableCell>
                  <TableCell>
                    <div>{r.salespersonName}</div>
                    <div className="text-xs text-muted-foreground">{r.zoneName}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(r.salesTarget || 0)} / {r.salesAchievement == null ? "—" : formatCurrency(r.salesAchievement)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(r.collectionTarget || 0)} /{" "}
                    {r.collectionAchievement == null ? "—" : formatCurrency(r.collectionAchievement)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {(r.plannedPlaces || []).join(", ") || "—"}
                    <div className="text-muted-foreground">{(r.actualPlaces || []).join(", ") || "no actuals"}</div>
                  </TableCell>
                  <TableCell className="text-xs text-red-700">
                    {[
                      r.missingActivity ? "Missing activity" : "",
                      r.missingClosing ? "Missing closing" : "",
                      r.closingWithoutActivity ? "Closing without activity" : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
