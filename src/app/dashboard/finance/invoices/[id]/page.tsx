"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { TaxInvoiceDocument } from "@/components/invoices/TaxInvoiceDocument";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArrowLeft, Printer, CheckCircle, Mail, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function InvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailForm, setEmailForm] = useState({ to: "", cc: "", message: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/invoices/${params.id}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setInvoice(data);
          const dealerEmail =
            (data.dealer as { email?: string } | undefined)?.email ||
            (data.email as string | undefined) ||
            "";
          setEmailForm((prev) => ({ ...prev, to: dealerEmail }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleFinalize = async () => {
    try {
      const res = await apiFetch(`/api/invoices/${params.id}/finalize`, { method: "POST" });
      if (res.ok) {
        setInvoice(await res.json());
      }
    } catch (error) {
      console.error("Error finalizing invoice:", error);
    }
  };

  const openPrint = () => {
    window.open(`/print/invoices/${params.id}`, "_blank", "noopener,noreferrer");
  };

  const handleSendEmail = async () => {
    if (!emailForm.to.trim()) {
      setEmailMsg("Enter recipient email address.");
      return;
    }
    setEmailSending(true);
    setEmailMsg(null);
    try {
      const res = await apiFetch(`/api/invoices/${params.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailMsg(data.message || "Email sent.");
        setTimeout(() => {
          setEmailOpen(false);
          setEmailMsg(null);
        }, 2500);
      } else {
        setEmailMsg(data.error || "Failed to send email.");
      }
    } catch {
      setEmailMsg("Network error.");
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/finance/invoices">Back to invoices</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[220mm] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/finance/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{String(invoice.invoiceNumber)}</h1>
            <p className="text-sm text-muted-foreground">Tax Invoice preview</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status === "DRAFT" && (
            <Button variant="outline" onClick={handleFinalize}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalize
            </Button>
          )}
          <Button variant="outline" onClick={() => setEmailOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" onClick={openPrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print / PDF
          </Button>
        </div>
      </div>

      <TaxInvoiceDocument invoice={invoice} />

      <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
        <StatusBadge status={String(invoice.status)} />
        {Number(invoice.paidAmount) > 0 && (
          <span>
            Paid: {formatCurrency(Number(invoice.paidAmount))} | Balance:{" "}
            {formatCurrency(Number(invoice.balanceAmount))}
          </span>
        )}
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send invoice by email</DialogTitle>
            <DialogDescription>
              Email invoice {String(invoice.invoiceNumber)} with a link to view and print.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {emailMsg && (
              <p className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm">{emailMsg}</p>
            )}
            <div className="space-y-2">
              <Label>To *</Label>
              <Input
                type="email"
                required
                value={emailForm.to}
                onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                placeholder="dealer@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>CC</Label>
              <Input
                value={emailForm.cc}
                onChange={(e) => setEmailForm({ ...emailForm, cc: e.target.value })}
                placeholder="accounts@daichi-international.in"
              />
            </div>
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                rows={4}
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                placeholder="Please find attached your tax invoice..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={emailSending}>
              {emailSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
