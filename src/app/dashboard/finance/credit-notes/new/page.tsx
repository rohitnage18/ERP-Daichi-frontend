"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";

export default function NewCreditNotePage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/finance/credit-notes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">New credit note</h1>
      </div>

      <Card className="border-border/80 shadow-card">
        <CardHeader>
          <CardTitle>Start from an invoice</CardTitle>
          <CardDescription>
            Credit notes are issued against an existing invoice (returns, rate difference, quality, etc.).
            Open the invoice, then use the finance workflow to raise a credit note request for management
            approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard/finance/invoices">
              <FileText className="mr-2 h-4 w-4" />
              Go to invoices
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/approvals">Open approvals</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
