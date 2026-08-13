"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface DealerRow {
  dealerId: string;
  dealerName: string;
  city?: string;
  revenue: number;
  invoiceCount: number;
  outstanding: number;
}

export default function DealerReportPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<DealerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/reports/analytics?month=${month}-01&limit=25`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setRows(Array.isArray(data.topDealers) ? data.topDealers : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold">Dealer Performance</h1>
            <p className="text-muted-foreground">Top dealers by invoice revenue</p>
          </div>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-44"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top dealers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">No invoice data for this month.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={row.dealerId || `${row.dealerName}-${i}`}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{row.dealerName || "—"}</TableCell>
                    <TableCell>{row.city || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.invoiceCount}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(row.revenue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.outstanding || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
