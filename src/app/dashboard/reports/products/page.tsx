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

interface ProductRow {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  revenue: number;
  invoiceCount: number;
}

export default function ProductReportPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/reports/analytics?month=${month}-01&limit=25`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setRows(Array.isArray(data.topProducts) ? data.topProducts : []);
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
            <h1 className="text-3xl font-bold">Product Analysis</h1>
            <p className="text-muted-foreground">Top products by invoice revenue</p>
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
          <CardTitle>Top products</CardTitle>
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
                  <TableHead>Product</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Qty (Nos)</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={row.productId || `${row.productCode}-${i}`}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{row.productName}</TableCell>
                    <TableCell className="font-mono text-xs">{row.productCode}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.invoiceCount}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(row.revenue)}
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
