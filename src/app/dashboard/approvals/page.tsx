"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiFetchJsonArray } from "@/lib/api";

const GRADE_OPTIONS = [
  { grade: "A", label: "Grade A — ₹5 Lakhs+", limit: 500000 },
  { grade: "B", label: "Grade B — ₹4 Lakhs+", limit: 400000 },
  { grade: "C", label: "Grade C — ₹3 Lakhs+", limit: 300000 },
  { grade: "D", label: "Grade D — ₹2 Lakhs+", limit: 200000 },
] as const;

interface PendingDealer {
  id: string;
  source?: "local" | "daichi";
  firmName: string;
  proprietorName: string;
  city: string;
  state?: string;
  gstNumber?: string;
  panNumber?: string;
  businessAddress?: string;
  contactNumber?: string;
  email?: string;
  districtName?: string;
  district?: { name: string };
  creditPeriod: string;
  createdAt: string;
  createdByName?: string;
  createdBy?: { fullName: string };
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  dealerName?: string;
  dealerCity?: string;
  dealer?: { firmName: string; city: string };
  createdByName?: string;
  createdBy?: { fullName: string };
  items?: Array<unknown>;
  _count?: { items: number };
}

interface PendingCreditNote {
  id: string;
  creditNoteNumber: string;
  creditNoteDate: string;
  type: string;
  reason: string;
  amount: number;
  status: string;
  dealerName?: string;
  invoiceNumber?: string;
  dealer?: { firmName: string };
  invoice?: { invoiceNumber: string };
  createdByName?: string;
}

interface PendingDebitNote {
  id: string;
  debitNoteNumber: string;
  debitNoteDate: string;
  type: string;
  reason: string;
  amount: number;
  status: string;
  dealerName?: string;
  invoiceNumber?: string;
  dealer?: { firmName: string };
  invoice?: { invoiceNumber: string };
}

const CREDIT_NOTE_TYPE_LABELS: Record<string, string> = {
  SALES_RETURN: "Sales Return",
  RATE_DIFFERENCE: "Rate Difference",
  QUALITY_ISSUE: "Quality Issue",
  SCHEME_DISCOUNT: "Scheme/Discount",
  OTHER: "Other",
};

const DEBIT_NOTE_TYPE_LABELS: Record<string, string> = {
  FREIGHT: "Freight / Transport",
  INTEREST: "Interest / Late Fee",
  PRICE_DIFFERENCE: "Price Difference",
  SHORT_PAYMENT: "Short Payment Recovery",
  OTHER: "Other",
};

export default function ApprovalsPage() {
  const [pendingDealers, setPendingDealers] = useState<PendingDealer[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [pendingCreditNotes, setPendingCreditNotes] = useState<PendingCreditNote[]>([]);
  const [pendingDebitNotes, setPendingDebitNotes] = useState<PendingDebitNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    type: string;
    id: string;
    source?: string;
  }>({
    open: false,
    type: "",
    id: "",
  });
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; dealer: PendingDealer | null }>({
    open: false,
    dealer: null,
  });
  const [dealerGrade, setDealerGrade] = useState<string>("D");
  const [creditLimit, setCreditLimit] = useState<string>("200000");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      const [dealersRes, daichiRes, ordersRes, creditNotes, debitNotes] = await Promise.all([
        apiFetch("/api/dealers?status=SUBMITTED"),
        apiFetch("/api/daichi-dealers?approvalStatus=PENDING"),
        apiFetch("/api/orders?status=PENDING_APPROVAL"),
        apiFetchJsonArray<PendingCreditNote>("/api/credit-notes?status=PENDING_APPROVAL"),
        apiFetchJsonArray<PendingDebitNote>("/api/debit-notes?status=PENDING_APPROVAL"),
      ]);
      const localDealers = await dealersRes.json();
      const daichiDealers = await daichiRes.json();

      const mergedDealers: PendingDealer[] = [
        ...(Array.isArray(localDealers)
          ? localDealers.map((d: PendingDealer) => ({
              ...d,
              id: d.id,
              source: "local" as const,
              proprietorName: d.proprietorName || "",
              creditPeriod: d.creditPeriod || "DAYS_60",
              createdAt: d.createdAt || new Date().toISOString(),
            }))
          : []),
        ...(Array.isArray(daichiDealers)
          ? daichiDealers
              .filter((d: { approvalStatus?: string }) => d.approvalStatus === "PENDING")
              .map((d: Record<string, string>) => ({
                id: d.id,
                source: "daichi" as const,
                firmName: d.firmName || "",
                proprietorName: d.contactPersonName || d.proprietorName || "—",
                city: d.city || "",
                state: d.state,
                gstNumber: d.gstNumber || d.gstNo,
                businessAddress: d.firmAddress || d.businessAddress,
                contactNumber: d.mobileNumber || d.contactNumber,
                email: d.email,
                creditPeriod: "DAYS_60",
                createdAt: d.sourceCreatedAt || d.lastSyncedAt || new Date().toISOString(),
                createdByName: "Daichi sync",
              }))
          : []),
      ];

      const orders = await ordersRes.json();
      setPendingDealers(mergedDealers);
      setPendingOrders(Array.isArray(orders) ? orders : []);
      setPendingCreditNotes(creditNotes);
      setPendingDebitNotes(debitNotes);
    } catch (error) {
      console.error("Failed to fetch pending items:", error);
      setPendingDealers([]);
      setPendingOrders([]);
      setPendingCreditNotes([]);
      setPendingDebitNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const openApproveDialog = (dealer: PendingDealer) => {
    setApproveDialog({ open: true, dealer });
    setDealerGrade("D");
    setCreditLimit("200000");
  };

  const handleGradeChange = (grade: string) => {
    setDealerGrade(grade);
    const option = GRADE_OPTIONS.find((g) => g.grade === grade);
    if (option) setCreditLimit(String(option.limit));
  };

  const handleApproveDealer = async () => {
    if (!approveDialog.dealer) return;
    setActionLoading(true);
    try {
      const isDaichi = approveDialog.dealer.source === "daichi";
      const endpoint = isDaichi
        ? `/api/daichi-dealers/${approveDialog.dealer.id}/approve`
        : `/api/dealers/${approveDialog.dealer.id}/approve`;
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerGrade,
          creditLimit: parseInt(creditLimit, 10) || 200000,
        }),
      });
      if (res.ok) {
        setApproveDialog({ open: false, dealer: null });
        fetchPendingItems();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Approval failed");
      }
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveOrder = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/orders/${id}/approve`, { method: "POST" });
      if (res.ok) fetchPendingItems();
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCreditNote = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/credit-notes/${id}/approve`, { method: "POST" });
      if (res.ok) fetchPendingItems();
      else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Approval failed");
      }
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveDebitNote = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/debit-notes/${id}/approve`, { method: "POST" });
      if (res.ok) fetchPendingItems();
      else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Approval failed");
      }
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectApiPath = (type: string, id: string, source?: string) => {
    if (type === "credit-note") return `/api/credit-notes/${id}/reject`;
    if (type === "debit-note") return `/api/debit-notes/${id}/reject`;
    if (type === "dealer" && source === "daichi") return `/api/daichi-dealers/${id}/reject`;
    return `/api/${type}s/${id}/reject`;
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiFetch(rejectApiPath(rejectDialog.type, rejectDialog.id, rejectDialog.source), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setRejectDialog({ open: false, type: "", id: "", source: undefined });
        setRejectReason("");
        fetchPendingItems();
      }
    } catch (error) {
      console.error("Rejection failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approvals</h1>
        <p className="text-muted-foreground">
          Review dealer registrations, orders, and credit note requests
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{pendingDealers.length}</p>
                <p className="text-sm text-muted-foreground">Pending Dealers</p>
              </div>
              <Badge variant="pending" className="text-lg px-3 py-1">Dealers</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
              </div>
              <Badge variant="pending" className="text-lg px-3 py-1">Orders</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{pendingCreditNotes.length}</p>
                <p className="text-sm text-muted-foreground">Pending Credit Notes</p>
              </div>
              <Receipt className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dealers">
        <TabsList>
          <TabsTrigger value="dealers">Dealers ({pendingDealers.length})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="credit-notes">Credit Notes ({pendingCreditNotes.length})</TabsTrigger>
          <TabsTrigger value="debit-notes">Debit Notes ({pendingDebitNotes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="dealers">
          <Card>
            <CardHeader>
              <CardTitle>Pending Dealer Approvals</CardTitle>
              <CardDescription>
                Verify dealer details and assign credit limit grade (A–D)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : pendingDealers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No pending dealer approvals</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Firm Name</TableHead>
                        <TableHead>Proprietor</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>GSTIN</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDealers.map((dealer) => (
                        <TableRow key={`${dealer.source}-${dealer.id}`}>
                          <TableCell>
                            <Badge variant={dealer.source === "daichi" ? "secondary" : "outline"}>
                              {dealer.source === "daichi" ? "Daichi" : "Registration"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{dealer.firmName}</TableCell>
                          <TableCell>{dealer.proprietorName}</TableCell>
                          <TableCell>{dealer.city}, {dealer.districtName || dealer.district?.name || dealer.state || ''}</TableCell>
                          <TableCell className="font-mono text-xs">{dealer.gstNumber || '—'}</TableCell>
                          <TableCell>{dealer.createdByName || dealer.createdBy?.fullName || ''}</TableCell>
                          <TableCell>{formatDate(dealer.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => openApproveDialog(dealer)} disabled={actionLoading}>
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600"
                                onClick={() =>
                                  setRejectDialog({
                                    open: true,
                                    type: "dealer",
                                    id: dealer.id,
                                    source: dealer.source,
                                  })
                                }
                                disabled={actionLoading}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Pending Order Approvals</CardTitle>
              <CardDescription>Review orders and approve for dispatch</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No pending order approvals</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Dealer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          {order.dealerName || order.dealer?.firmName || ''}
                          <br />
                          <span className="text-xs text-muted-foreground">{order.dealerCity || order.dealer?.city || ''}</span>
                        </TableCell>
                        <TableCell>{order.items?.length ?? order._count?.items ?? 0} items</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell>{order.createdByName || order.createdBy?.fullName || ''}</TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/orders/${order.id}`}>View</Link>
                            </Button>
                            <Button size="sm" onClick={() => handleApproveOrder(order.id)} disabled={actionLoading}>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() => setRejectDialog({ open: true, type: "order", id: order.id })}
                              disabled={actionLoading}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit-notes">
          <Card>
            <CardHeader>
              <CardTitle>Pending Credit Note Approvals</CardTitle>
              <CardDescription>
                Review credit notes submitted by accounts — approve or reject only
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : pendingCreditNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No pending credit note approvals</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CN Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Dealer</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingCreditNotes.map((cn) => (
                      <TableRow key={cn.id}>
                        <TableCell className="font-medium">{cn.creditNoteNumber}</TableCell>
                        <TableCell>{formatDate(cn.creditNoteDate)}</TableCell>
                        <TableCell>{cn.dealerName || cn.dealer?.firmName || "—"}</TableCell>
                        <TableCell>{cn.invoiceNumber || cn.invoice?.invoiceNumber || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CREDIT_NOTE_TYPE_LABELS[cn.type] || cn.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{cn.reason}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(cn.amount)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveCreditNote(cn.id)}
                              disabled={actionLoading}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() =>
                                setRejectDialog({ open: true, type: "credit-note", id: cn.id })
                              }
                              disabled={actionLoading}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debit-notes">
          <Card>
            <CardHeader>
              <CardTitle>Pending Debit Note Approvals</CardTitle>
              <CardDescription>
                Review debit notes submitted by accounts — approving adds the amount to the invoice
                balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : pendingDebitNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No pending debit note approvals</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DN Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Dealer</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDebitNotes.map((dn) => (
                      <TableRow key={dn.id}>
                        <TableCell className="font-medium">{dn.debitNoteNumber}</TableCell>
                        <TableCell>{formatDate(dn.debitNoteDate)}</TableCell>
                        <TableCell>{dn.dealerName || dn.dealer?.firmName || "—"}</TableCell>
                        <TableCell>{dn.invoiceNumber || dn.invoice?.invoiceNumber || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {DEBIT_NOTE_TYPE_LABELS[dn.type] || dn.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{dn.reason}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(dn.amount)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveDebitNote(dn.id)}
                              disabled={actionLoading}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() =>
                                setRejectDialog({ open: true, type: "debit-note", id: dn.id })
                              }
                              disabled={actionLoading}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dealer Dialog with Credit Grade */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ ...approveDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Dealer & Assign Credit</DialogTitle>
            <DialogDescription>
              Verify details and set credit limit grade for {approveDialog.dealer?.firmName}
            </DialogDescription>
          </DialogHeader>
          {approveDialog.dealer && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border bg-slate-50 p-3 space-y-1">
                <p><strong>Firm:</strong> {approveDialog.dealer.firmName}</p>
                <p><strong>Proprietor:</strong> {approveDialog.dealer.proprietorName}</p>
                <p><strong>Address:</strong> {approveDialog.dealer.businessAddress || '—'}</p>
                <p><strong>City:</strong> {approveDialog.dealer.city}</p>
                <p><strong>GSTIN:</strong> {approveDialog.dealer.gstNumber || '—'}</p>
                <p><strong>PAN:</strong> {approveDialog.dealer.panNumber || '—'}</p>
                <p><strong>Contact:</strong> {approveDialog.dealer.contactNumber || '—'}</p>
                <p><strong>Email:</strong> {approveDialog.dealer.email || '—'}</p>
              </div>
              <div className="space-y-2">
                <Label>Dealer Grade *</Label>
                <Select value={dealerGrade} onValueChange={handleGradeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map((g) => (
                      <SelectItem key={g.grade} value={g.grade}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credit Limit (₹)</Label>
                <Input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-filled from grade. You can adjust if needed.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, dealer: null })}>Cancel</Button>
            <Button onClick={handleApproveDealer} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve Dealer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reject{" "}
              {rejectDialog.type === "dealer"
                ? "Dealer"
                : rejectDialog.type === "credit-note"
                  ? "Credit Note"
                  : rejectDialog.type === "debit-note"
                    ? "Debit Note"
                    : "Order"}
            </DialogTitle>
            <DialogDescription>Please provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, type: "", id: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
