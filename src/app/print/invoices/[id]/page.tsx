"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { TaxInvoiceDocument } from "@/components/invoices/TaxInvoiceDocument";
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
import { ArrowLeft, Printer, Mail, Loader2 } from "lucide-react";

export default function PrintInvoicePage() {
  const params = useParams();
  const router = useRouter();
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-600">Preparing invoice…</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-sm text-gray-600">Invoice not found.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/finance/invoices")}>
          Back to invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="invoice-print-page min-h-screen bg-white">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white/95 px-4 py-3 backdrop-blur">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/finance/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Send invoice by email
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="p-4 print:p-0">
        <TaxInvoiceDocument invoice={invoice} />
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="no-print">
          <DialogHeader>
            <DialogTitle>Send invoice by email</DialogTitle>
            <DialogDescription>
              Email invoice {String(invoice.invoiceNumber)} with a link to view and print.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {emailMsg && (
              <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
                {emailMsg}
              </p>
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
                placeholder="Please find your tax invoice..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
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
