"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { TaxInvoiceDocument } from "@/components/invoices/TaxInvoiceDocument";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

/**
 * Public invoice view for emailed share links — no login required.
 */
export default function PublicInvoiceViewPage() {
  const params = useParams();
  const token = String(params.token || "");
  const [invoice, setInvoice] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/invoices/public/${encodeURIComponent(token)}`));
        if (!res.ok) {
          if (!cancelled) setError("Invoice not found or link expired.");
          return;
        }
        const data = await res.json();
        if (!cancelled) setInvoice(data);
      } catch {
        if (!cancelled) setError("Could not load invoice.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-600">Loading invoice…</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-600">{error || "Invoice not found."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white/95 px-4 py-3">
        <p className="text-sm font-medium text-gray-700">
          Invoice {String(invoice.invoiceNumber)}
        </p>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
      <div className="p-4 print:p-0">
        <TaxInvoiceDocument invoice={invoice} />
      </div>
    </div>
  );
}
