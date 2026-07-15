"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface CreditNote {
  id: string;
  creditNoteNumber: string;
  creditNoteDate: string;
  type: string;
  reason: string;
  amount: number;
  status: string;
  dealer: {
    firmName: string;
  };
  invoice: {
    invoiceNumber: string;
  };
}

const typeLabels: Record<string, string> = {
  SALES_RETURN: "Sales Return",
  RATE_DIFFERENCE: "Rate Difference",
  QUALITY_ISSUE: "Quality Issue",
  SCHEME_DISCOUNT: "Scheme/Discount",
  OTHER: "Other",
};

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  const fetchCreditNotes = async () => {
    try {
      const res = await apiFetch("/api/credit-notes");
      const data = await res.json();
      setCreditNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch credit notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCreditNotes = creditNotes.filter(
    (cn) =>
      cn.creditNoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      cn.dealer.firmName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credit Notes</h1>
          <p className="text-muted-foreground">
            Manage credit notes for returns and adjustments
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/finance/credit-notes/new">
            <Plus className="mr-2 h-4 w-4" />
            Create credit note
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credit Notes</p>
                <p className="text-2xl font-bold">{creditNotes.length || 0}</p>
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
                  {creditNotes.filter((cn) => cn.status === "PENDING_APPROVAL").length || 0}
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
                  {formatCurrency(creditNotes.reduce((sum, cn) => sum + cn.amount, 0) || 0)}
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
              placeholder="Search credit notes..."
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
                  <TableHead>CN Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCreditNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No credit notes found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCreditNotes.map((cn) => (
                    <TableRow key={cn.id}>
                      <TableCell className="font-medium">{cn.creditNoteNumber}</TableCell>
                      <TableCell>{formatDate(cn.creditNoteDate)}</TableCell>
                      <TableCell>{cn.dealer.firmName}</TableCell>
                      <TableCell>{cn.invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[cn.type] || cn.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(cn.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={cn.status} />
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
