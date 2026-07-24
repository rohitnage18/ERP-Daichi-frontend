"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, apiFetchJsonArray } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, CreditCard, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Payment {
  id: string;
  paymentDate: string;
  paymentMode: string;
  referenceNumber: string | null;
  amount: number;
  netAmount: number;
  dealer: {
    firmName: string;
    dealerCode: string | null;
  };
  recordedBy: {
    fullName: string;
  };
}

interface DealerOption {
  id: string;
  firmName: string;
  dealerCode: string | null;
}

interface OpenInvoice {
  id: string;
  invoiceNumber: string;
  balanceAmount: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [outstanding, setOutstanding] = useState<{
    totalOutstanding: number;
    overdueOutstanding: number;
    openInvoices: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    dealerId: "",
    invoiceId: "",
    amount: "",
    paymentMode: "",
    referenceNumber: "",
    paymentDate: new Date().toISOString().slice(0, 10),
  });

  const fetchPayments = async () => {
    try {
      const res = await apiFetch("/api/payments");
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutstanding = async () => {
    try {
      const res = await apiFetch("/api/payments/outstanding");
      if (res.ok) setOutstanding(await res.json());
    } catch (error) {
      console.error("Failed to fetch outstanding:", error);
    }
  };

  const fetchOpenInvoices = async (dealerId: string) => {
    if (!dealerId) {
      setOpenInvoices([]);
      return;
    }
    const data = await apiFetchJsonArray<{
      id?: string;
      _id?: string;
      invoiceNumber?: string;
      balanceAmount?: number;
    }>(`/api/invoices?dealerId=${encodeURIComponent(dealerId)}`);
    setOpenInvoices(
      data
        .filter((inv) => (inv.balanceAmount ?? 0) > 0)
        .map((inv) => ({
          id: inv.id || inv._id || "",
          invoiceNumber: inv.invoiceNumber || "",
          balanceAmount: inv.balanceAmount ?? 0,
        }))
    );
  };

  const fetchDealers = async () => {
    const data = await apiFetchJsonArray<{ id?: string; _id?: string; firmName?: string; externalId?: string }>(
      "/api/daichi-dealers"
    );
    setDealers(
      data.map((d) => ({
        id: d.id || d._id || "",
        firmName: d.firmName || "",
        dealerCode: d.externalId || "",
      }))
    );
  };

  useEffect(() => {
    fetchPayments();
    fetchOutstanding();
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      setFormError("");
      fetchDealers();
    }
  }, [dialogOpen]);

  useEffect(() => {
    fetchOpenInvoices(form.dealerId);
    setForm((f) => ({ ...f, invoiceId: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.dealerId]);

  const handleRecordPayment = async () => {
    setFormError("");
    if (!form.dealerId || !form.paymentMode || !form.amount) {
      setFormError("Please fill dealer, amount, and payment mode.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: form.dealerId,
          invoiceId: form.invoiceId || undefined,
          paymentMode: form.paymentMode,
          amount: Number(form.amount),
          referenceNumber: form.referenceNumber || undefined,
          paymentDate: new Date(form.paymentDate).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || "Could not save payment.");
        return;
      }
      setDialogOpen(false);
      setForm({
        dealerId: "",
        invoiceId: "",
        amount: "",
        paymentMode: "",
        referenceNumber: "",
        paymentDate: new Date().toISOString().slice(0, 10),
      });
      await Promise.all([fetchPayments(), fetchOutstanding()]);
    } catch {
      setFormError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.dealer.firmName.toLowerCase().includes(search.toLowerCase()) ||
      payment.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      payment.dealer.dealerCode?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = payments.reduce((sum, p) => sum + p.netAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Record and track dealer payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record payment</DialogTitle>
              <DialogDescription>Record a payment received from a dealer.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {formError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label>Dealer</Label>
                <Select
                  value={form.dealerId}
                  onValueChange={(v) => setForm((f) => ({ ...f, dealerId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dealer" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.firmName}
                        {d.dealerCode ? ` (${d.dealerCode})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Apply to invoice (optional)</Label>
                <Select
                  value={form.invoiceId || "AUTO"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, invoiceId: v === "AUTO" ? "" : v }))
                  }
                  disabled={!form.dealerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto (oldest dues first)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">Auto — oldest dues first</SelectItem>
                    {openInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} · {formatCurrency(inv.balanceAmount)} due
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.dealerId && openInvoices.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No open invoices — payment will be kept on account.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment date</Label>
                <Input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment mode</Label>
                <Select
                  value={form.paymentMode}
                  onValueChange={(v) => setForm((f) => ({ ...f, paymentMode: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="NEFT">NEFT</SelectItem>
                    <SelectItem value="RTGS">RTGS</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference number</Label>
                <Input
                  placeholder="Cheque / UTR / transaction ID"
                  value={form.referenceNumber}
                  onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} type="button">
                Cancel
              </Button>
              <Button onClick={handleRecordPayment} disabled={submitting} type="button">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total collected</p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(totalCollected || 0)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-brand-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payments recorded</p>
                <p className="text-2xl font-bold tabular-nums">{payments.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold tabular-nums text-amber-700">
                  {formatCurrency(outstanding?.totalOutstanding ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {outstanding?.openInvoices ?? 0} open ·{" "}
                  {formatCurrency(outstanding?.overdueOutstanding ?? 0)} overdue
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-card">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Recorded by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No payments recorded yet. Use &quot;Record payment&quot; to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.dealer.firmName}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.dealer.dealerCode || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.paymentMode}</Badge>
                      </TableCell>
                      <TableCell>{payment.referenceNumber || "—"}</TableCell>
                      <TableCell className="text-right font-medium text-brand-700 tabular-nums">
                        {formatCurrency(payment.netAmount)}
                      </TableCell>
                      <TableCell>{payment.recordedBy.fullName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
