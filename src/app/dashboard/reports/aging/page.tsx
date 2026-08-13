"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AgingRow {
  invoiceNumber: string;
  dealer: string;
  zone: string;
  dueDate: string;
  balanceAmount: number;
  daysOverdue: number;
  bucket: string;
}

export default function AgingReportPage() {
  const [agingData, setAgingData] = useState<AgingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/reports/aging")
      .then((r) => r.json())
      .then((d) => setAgingData(Array.isArray(d) ? d : []))
      .catch(() => setAgingData([]))
      .finally(() => setLoading(false));
  }, []);

  const bucketTotals = agingData.reduce(
    (acc, row) => {
      acc[row.bucket] = (acc[row.bucket] || 0) + row.balanceAmount;
      acc.total += row.balanceAmount;
      return acc;
    },
    { total: 0 } as Record<string, number>
  );

  const exportCsv = () => {
    const header = "Invoice,Dealer,Zone,Due Date,Balance,Days Overdue,Bucket\n";
    const rows = agingData
      .map(
        (r) =>
          `${r.invoiceNumber},${r.dealer},${r.zone},${r.dueDate},${r.balanceAmount},${r.daysOverdue},${r.bucket}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aging-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Aging Report</h1>
            <p className="text-muted-foreground">Outstanding invoices from live data</p>
          </div>
        <Button variant="outline" onClick={exportCsv} disabled={agingData.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {["Current", "1-30 days", "31-60 days", "60+ days"].map((bucket) => (
          <Card key={bucket}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{bucket}</p>
              <p className="text-xl font-bold">
                {formatCurrency(bucketTotals[bucket] || 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice aging</CardTitle>
          <CardDescription>
            Total outstanding: {formatCurrency(bucketTotals.total || 0)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : agingData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No outstanding invoices.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Bucket</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agingData.map((row) => (
                  <TableRow key={row.invoiceNumber}>
                    <TableCell className="font-medium">{row.invoiceNumber}</TableCell>
                    <TableCell>{row.dealer}</TableCell>
                    <TableCell>{row.zone}</TableCell>
                    <TableCell>{formatDate(row.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={row.daysOverdue > 30 ? "destructive" : "secondary"}>
                        {row.bucket}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.balanceAmount)}
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
