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
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface ZoneRow {
  zone: string;
  orders: number;
  revenue: number;
  dealers: number;
}

export default function SalesReportPage() {
  const [salesData, setSalesData] = useState<ZoneRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/reports/sales")
      .then((r) => r.json())
      .then((d) => setSalesData(Array.isArray(d) ? d : []))
      .catch(() => setSalesData([]))
      .finally(() => setLoading(false));
  }, []);

  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);

  const exportCsv = () => {
    const header = "Zone,Orders,Revenue,Dealers\n";
    const rows = salesData
      .map((d) => `${d.zone},${d.orders},${d.revenue},${d.dealers}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Sales Report</h1>
            <p className="text-muted-foreground">Zone-wise sales from live orders</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={salesData.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Orders (MTD)</p>
            <p className="text-3xl font-bold">{loading ? "…" : totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue (MTD)</p>
            <p className="text-3xl font-bold">{loading ? "…" : formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zone-wise Performance</CardTitle>
          <CardDescription>Current month — from database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Dealers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((row) => (
                  <TableRow key={row.zone}>
                    <TableCell className="font-medium">{row.zone}</TableCell>
                    <TableCell className="text-right">{row.orders}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell className="text-right">{row.dealers}</TableCell>
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
