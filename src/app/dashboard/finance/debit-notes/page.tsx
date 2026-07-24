"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DebitNote {
  id: string;
  debitNoteNumber: string;
  debitNoteDate: string;
  type: string;
  reason: string;
  amount: number;
  status: string;
  dealer: { firmName: string };
  invoice: { invoiceNumber: string };
}

const typeLabels: Record<string, string> = {
  FREIGHT: "Freight / Transport",
  INTEREST: "Interest / Late Fee",
  PRICE_DIFFERENCE: "Price Difference",
  SHORT_PAYMENT: "Short Payment Recovery",
  OTHER: "Other",
};

export default function DebitNotesPage() {
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDebitNotes();
  }, []);

  const fetchDebitNotes = async () => {
    try {
      const res = await apiFetch("/api/debit-notes");
      const data = await res.json();
      setDebitNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch debit notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = debitNotes.filter(
    (dn) =>
      dn.debitNoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      dn.dealer.firmName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debit Notes</h1>
          <p className="text-muted-foreground">
            Raise additional charges against an invoice (freight, interest, recovery)
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/finance/debit-notes/new">
            <Plus className="mr-2 h-4 w-4" />
            Create debit note
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Debit Notes</p>
                <p className="text-2xl font-bold">{debitNotes.length || 0}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-600">
                  {debitNotes.filter((dn) => dn.status === "PENDING_APPROVAL").length || 0}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(debitNotes.reduce((sum, dn) => sum + dn.amount, 0) || 0)}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search debit notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DN Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No debit notes found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((dn) => (
                    <TableRow key={dn.id}>
                      <TableCell className="font-medium">{dn.debitNoteNumber}</TableCell>
                      <TableCell>{formatDate(dn.debitNoteDate)}</TableCell>
                      <TableCell>{dn.dealer.firmName}</TableCell>
                      <TableCell>{dn.invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[dn.type] || dn.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(dn.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={dn.status} />
                      </TableCell>
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
