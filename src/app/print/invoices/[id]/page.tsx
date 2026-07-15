"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { TaxInvoiceDocument } from "@/components/invoices/TaxInvoiceDocument";

export default function PrintInvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/invoices/${params.id}`);
        if (res.ok && !cancelled) {
          setInvoice(await res.json());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!invoice) return;
    const timer = setTimeout(() => window.print(), 500);
    return () => clearTimeout(timer);
  }, [invoice]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-600">Preparing invoice for print…</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-600">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div className="invoice-print-page min-h-screen bg-white p-4 print:p-0">
      <TaxInvoiceDocument invoice={invoice} />
    </div>
  );
}
