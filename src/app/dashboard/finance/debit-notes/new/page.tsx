"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, apiFetchJsonArray } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

interface InvoiceOption {
  id: string;
  invoiceNumber: string;
  dealerName: string;
  totalAmount: number;
  balanceAmount: number;
}

const TYPE_OPTIONS = [
  { value: "FREIGHT", label: "Freight / Transport" },
  { value: "INTEREST", label: "Interest / Late Fee" },
  { value: "PRICE_DIFFERENCE", label: "Price Difference" },
  { value: "SHORT_PAYMENT", label: "Short Payment Recovery" },
  { value: "OTHER", label: "Other" },
];

export default function NewDebitNotePage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    invoiceId: "",
    type: "FREIGHT",
    amount: "",
    reason: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetchJsonArray<{
          id?: string;
          _id?: string;
          invoiceNumber?: string;
          dealerName?: string;
          totalAmount?: number;
          balanceAmount?: number;
          status?: string;
        }>("/api/invoices");
        setInvoices(
          data
            .filter((inv) => inv.status !== "CANCELLED")
            .map((inv) => ({
              id: inv.id || inv._id || "",
              invoiceNumber: inv.invoiceNumber || "",
              dealerName: inv.dealerName || "",
              totalAmount: inv.totalAmount ?? 0,
              balanceAmount: inv.balanceAmount ?? 0,
            }))
        );
      } catch {
        setError("Could not load invoices.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === form.invoiceId),
    [invoices, form.invoiceId]
  );

  const handleSubmit = async () => {
    setError("");
    if (!form.invoiceId) {
      setError("Please select an invoice.");
      return;
    }
    const amt = Number(form.amount);
    if (!amt || amt <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!form.reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/debit-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: form.invoiceId,
          type: form.type,
          amount: amt,
          reason: form.reason.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Could not create debit note.");
        return;
      }
      router.push("/dashboard/finance/debit-notes");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/finance/debit-notes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">New debit note</h1>
      </div>

      <Card className="border-border/80 shadow-card">
        <CardHeader>
          <CardTitle>Debit note details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Invoice</Label>
            <Select
              value={form.invoiceId}
              onValueChange={(v) => setForm((f) => ({ ...f, invoiceId: v }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading invoices..." : "Select invoice"} />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} · {inv.dealerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedInvoice && (
              <p className="text-xs text-muted-foreground">
                Invoice total {formatCurrency(selectedInvoice.totalAmount)} · balance{" "}
                {formatCurrency(selectedInvoice.balanceAmount)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              placeholder="Describe the reason for this debit note"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            The debit note is created as <strong>Pending approval</strong>. Once management
            approves it, the amount is added to the invoice balance automatically.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create debit note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
