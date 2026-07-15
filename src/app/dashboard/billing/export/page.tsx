"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";

export default function GSTNExportPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("all");
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingInvoices, setExportingInvoices] = useState(false);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (status && status !== "all") params.set("status", status);
    return params.toString();
  };

  const downloadFile = async (url: string, filename: string) => {
    const res = await apiFetch(url);
    if (!res.ok) {
      throw new Error("Export failed");
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  };

  const handleExportGSTNExcel = async () => {
    setExportingExcel(true);
    try {
      const qs = buildQueryString();
      const today = new Date().toISOString().split("T")[0];
      await downloadFile(
        `/api/exports/gstn/excel${qs ? `?${qs}` : ""}`,
        `gstn-export-${today}.xlsx`
      );
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export GSTN data");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportGSTNJson = async () => {
    setExportingJson(true);
    try {
      const qs = buildQueryString();
      const today = new Date().toISOString().split("T")[0];
      await downloadFile(
        `/api/exports/gstn/json${qs ? `?${qs}` : ""}`,
        `gstn-export-${today}.json`
      );
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export GSTN data");
    } finally {
      setExportingJson(false);
    }
  };

  const handleExportInvoicesExcel = async () => {
    setExportingInvoices(true);
    try {
      const qs = buildQueryString();
      const today = new Date().toISOString().split("T")[0];
      await downloadFile(
        `/api/exports/invoices/excel${qs ? `?${qs}` : ""}`,
        `invoices-${today}.xlsx`
      );
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export invoices");
    } finally {
      setExportingInvoices(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/billing">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">GSTN Export</h1>
          <p className="text-muted-foreground">
            Export invoices for GST filing in Excel and JSON formats
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Export Filters</CardTitle>
            <CardDescription>
              Filter invoices by date range and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Invoice Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Periods</CardTitle>
            <CardDescription>
              Select a predefined period for GSTN filing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                setStartDate(firstDay.toISOString().split("T")[0]);
                setEndDate(lastDay.toISOString().split("T")[0]);
              }}
            >
              Current Month
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
                setStartDate(firstDay.toISOString().split("T")[0]);
                setEndDate(lastDay.toISOString().split("T")[0]);
              }}
            >
              Last Month
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                const now = new Date();
                const quarter = Math.floor(now.getMonth() / 3);
                const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
                const lastDay = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                setStartDate(firstDay.toISOString().split("T")[0]);
                setEndDate(lastDay.toISOString().split("T")[0]);
              }}
            >
              Current Quarter
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                const now = new Date();
                const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
                setStartDate(`${fy}-04-01`);
                setEndDate(`${fy + 1}-03-31`);
              }}
            >
              Current Financial Year
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">GSTN Excel</CardTitle>
                <CardDescription>
                  B2B format for GST portal upload
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Export invoices in GSTR-1 B2B format with HSN summary. 
              Compatible with GST portal bulk upload.
            </p>
            <Button
              className="w-full"
              onClick={handleExportGSTNExcel}
              disabled={exportingExcel}
            >
              {exportingExcel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <FileJson className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">GSTN JSON</CardTitle>
                <CardDescription>
                  JSON format for API integration
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Export invoices in structured JSON format. 
              Ideal for integration with accounting software and GST APIs.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleExportGSTNJson}
              disabled={exportingJson}
            >
              {exportingJson ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <FileSpreadsheet className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Invoices Report</CardTitle>
                <CardDescription>
                  Full invoice details export
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Export all invoice details including payment status, 
              balance amounts, and e-way bill information.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleExportInvoicesExcel}
              disabled={exportingInvoices}
            >
              {exportingInvoices ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">GSTN Excel Format Includes:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>B2B Invoice Summary (GSTR-1 format)</li>
                <li>Line Item Details with HSN codes</li>
                <li>HSN Summary for filing</li>
                <li>CGST, SGST, IGST breakup</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">GSTN JSON Format Includes:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Summary statistics</li>
                <li>Complete invoice data</li>
                <li>All line items with tax details</li>
                <li>Ready for API integration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
