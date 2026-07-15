"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  Users,
  ShoppingCart,
  Package,
  IndianRupee,
  Sprout,
  Clock,
  AlertCircle,
  CheckCircle,
  Truck,
  FileText,
  BarChart3,
  Settings,
  Warehouse,
  CreditCard,
  Receipt,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface PendingDealer {
  id: string;
  firmName: string;
  city: string;
  districtName?: string;
  district?: { name: string };
  createdAt: string;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  dealerName?: string;
  dealer?: { firmName: string };
}

interface PendingCreditNote {
  id: string;
  creditNoteNumber: string;
  amount: number;
  dealerName?: string;
  dealer?: { firmName: string };
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  dealerName?: string;
  dealer?: { firmName: string };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [pendingDealers, setPendingDealers] = useState<PendingDealer[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [pendingCreditNotes, setPendingCreditNotes] = useState<PendingCreditNote[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [stats, setStats] = useState<{
    totalDealers: number;
    pendingDealerApprovals: number;
    ordersThisMonth: number;
    pendingOrders: number;
    revenueMtd: number;
    activeProducts: number;
    lowStockCount: number;
    overdueInvoices: number;
    pendingDispatch: number;
    pendingInvoiceDispatch: number;
    activeDispatches: number;
    deliveredDispatches: number;
    totalInvoices: number;
    sentInvoices: number;
    paidInvoices: number;
    outstandingRevenue: number;
    collectedRevenue: number;
    paymentsMtd: number;
    pendingCreditNotes: number;
    totalCreditNotes: number;
    totalInventorySkus: number;
    processingOrders: number;
    dispatchedOrders: number;
    deliveredOrders: number;
  } | null>(null);

  useEffect(() => {
    apiFetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.stats) {
          const s = data.stats;
          setStats({
            totalDealers: s.totalDealers || 0,
            pendingDealerApprovals: s.pendingDealerApprovals ?? s.submittedDealers ?? 0,
            ordersThisMonth: s.totalOrders || 0,
            pendingOrders: s.pendingOrders || 0,
            activeProducts: s.activeProducts || s.totalProducts || 0,
            lowStockCount: s.lowStockCount || 0,
            revenueMtd: s.totalRevenue || 0,
            overdueInvoices: s.overdueInvoices || 0,
            pendingDispatch: s.pendingDispatch || 0,
            pendingInvoiceDispatch: s.pendingInvoiceDispatch || 0,
            activeDispatches: s.activeDispatches || 0,
            deliveredDispatches: s.deliveredDispatches || 0,
            totalInvoices: s.totalInvoices || 0,
            sentInvoices: s.sentInvoices || 0,
            paidInvoices: s.paidInvoices || 0,
            outstandingRevenue: s.outstandingRevenue || 0,
            collectedRevenue: s.collectedRevenue || 0,
            paymentsMtd: s.paymentsMtd || s.collectedRevenue || 0,
            pendingCreditNotes: s.pendingCreditNotes || 0,
            totalCreditNotes: s.totalCreditNotes || 0,
            totalInventorySkus: s.totalInventorySkus || 0,
            processingOrders: s.processingOrders || 0,
            dispatchedOrders: s.dispatchedOrders || 0,
            deliveredOrders: s.deliveredOrders || 0,
          });
        } else if (data) {
          setStats(data);
        }
      })
      .catch(() => setStats(null));
  }, []);

  const refreshPending = useCallback(async () => {
    if (role !== "MANAGEMENT_ADMIN") return;
    setLoadingPending(true);
    try {
      const [dRes, daichiRes, oRes, cnRes] = await Promise.all([
        apiFetch("/api/dealers?status=SUBMITTED"),
        apiFetch("/api/daichi-dealers?approvalStatus=PENDING"),
        apiFetch("/api/orders?status=PENDING_APPROVAL"),
        apiFetch("/api/credit-notes?status=PENDING_APPROVAL"),
      ]);
      const localDealers = await dRes.json();
      const daichiDealers = await daichiRes.json();
      const mergedDealers = [
        ...(Array.isArray(localDealers) ? localDealers : []),
        ...(Array.isArray(daichiDealers)
          ? daichiDealers.filter((d: { approvalStatus?: string }) => d.approvalStatus === "PENDING")
          : []),
      ];
      const orders = await oRes.json();
      const creditNotes = await cnRes.json();
      setPendingDealers(mergedDealers);
      setPendingOrders(Array.isArray(orders) ? orders : []);
      setPendingCreditNotes(Array.isArray(creditNotes) ? creditNotes : []);
    } catch {
      setPendingDealers([]);
      setPendingOrders([]);
      setPendingCreditNotes([]);
    } finally {
      setLoadingPending(false);
    }
  }, [role]);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await apiFetch("/api/orders");
        const data = await res.json();
        setRecentOrders(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch {
        setRecentOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadRecent();
  }, []);

  const approvalRows: { kind: "dealer" | "order" | "credit-note"; id: string; title: string; subtitle: string }[] = [];
  for (const d of pendingDealers) {
    if (approvalRows.length >= 4) break;
    approvalRows.push({
      kind: "dealer",
      id: d.id,
      title: `New dealer: ${d.firmName}`,
      subtitle: `${d.city}, ${d.districtName || d.district?.name || ''} • ${formatDate(d.createdAt)}`,
    });
  }
  for (const o of pendingOrders) {
    if (approvalRows.length >= 4) break;
    approvalRows.push({
      kind: "order",
      id: o.id,
      title: o.orderNumber,
      subtitle: `${formatCurrency(o.totalAmount)} • ${o.dealerName || o.dealer?.firmName || ''}`,
    });
  }
  for (const cn of pendingCreditNotes) {
    if (approvalRows.length >= 4) break;
    approvalRows.push({
      kind: "credit-note",
      id: cn.id,
      title: cn.creditNoteNumber,
      subtitle: `${formatCurrency(cn.amount)} • ${cn.dealerName || cn.dealer?.firmName || ''}`,
    });
  }

  const approveDealer = async (id: string) => {
    const res = await apiFetch(`/api/dealers/${id}/approve`, { method: "POST" });
    if (res.ok) await refreshPending();
  };

  const approveOrder = async (id: string) => {
    const res = await apiFetch(`/api/orders/${id}/approve`, { method: "POST" });
    if (res.ok) {
      await refreshPending();
      const r = await apiFetch("/api/orders");
      const data = await r.json();
      setRecentOrders(Array.isArray(data) ? data.slice(0, 5) : []);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          {role === "MANAGEMENT_ADMIN"
            ? "Overall business status — detailed modules are managed by other roles"
            : "Overview of your business operations"}
        </p>
      </div>

      {role === "MANAGEMENT_ADMIN" && stats && (
        <Card className="border-border/80 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Operations overview</CardTitle>
            <CardDescription>
              Read-only summary across logistics, inventory, finance, and approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Truck className="h-4 w-4" /> Logistics
                </div>
                <p className="text-2xl font-bold">
                  {(stats.pendingInvoiceDispatch || 0) + (stats.pendingDispatch || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Awaiting dispatch</p>
                <p className="mt-2 text-sm">
                  {stats.pendingInvoiceDispatch} invoices · {stats.pendingDispatch} orders ·{" "}
                  {stats.activeDispatches} in transit
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Warehouse className="h-4 w-4" /> Inventory
                </div>
                <p className="text-2xl font-bold">{stats.totalInventorySkus}</p>
                <p className="text-xs text-muted-foreground">SKUs tracked</p>
                <p className="mt-2 text-sm text-amber-700">{stats.lowStockCount} low stock items</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" /> Invoices
                </div>
                <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                <p className="text-xs text-muted-foreground">Total invoices</p>
                <p className="mt-2 text-sm">{stats.overdueInvoices} overdue · {stats.paidInvoices} paid</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CreditCard className="h-4 w-4" /> Payments
                </div>
                <p className="text-2xl font-bold">{formatCurrency(stats.paymentsMtd)}</p>
                <p className="text-xs text-muted-foreground">Collected this month</p>
                <p className="mt-2 text-sm">{formatCurrency(stats.outstandingRevenue)} outstanding</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Receipt className="h-4 w-4" /> Credit notes
                </div>
                <p className="text-2xl font-bold">{stats.pendingCreditNotes}</p>
                <p className="text-xs text-muted-foreground">Pending your approval</p>
                <p className="mt-2 text-sm">{stats.totalCreditNotes} total in system</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Dealers"
          value={stats ? String(stats.totalDealers) : "—"}
          icon={Users}
          description={
            stats ? `${stats.pendingDealerApprovals} pending approval` : "Loading..."
          }
        />
        <StatCard
          title="Orders This Month"
          value={stats ? String(stats.ordersThisMonth) : "—"}
          icon={ShoppingCart}
          description={stats ? `${stats.pendingOrders} pending approval` : "Loading..."}
        />
        <StatCard
          title="Products"
          value={stats ? String(stats.activeProducts) : "—"}
          icon={Package}
          description={stats ? `${stats.lowStockCount} low stock` : "Loading..."}
        />
        <StatCard
          title="Revenue (MTD)"
          value={stats ? formatCurrency(stats.revenueMtd) : "—"}
          icon={IndianRupee}
          description={stats ? `${stats.overdueInvoices} overdue invoices` : "Loading..."}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {role === "MANAGEMENT_ADMIN" && (
          <Card className="border-border/80 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-amber-600" />
                Pending approvals
              </CardTitle>
              <CardDescription>Items requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                </div>
              ) : approvalRows.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No pending approvals. You are all caught up.</p>
              ) : (
                <div className="space-y-3">
                  {approvalRows.map((row) => (
                    <div
                      key={`${row.kind}-${row.id}`}
                      className="flex flex-col gap-3 rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{row.title}</p>
                        <p className="text-sm text-muted-foreground">{row.subtitle}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={
                              row.kind === "dealer"
                                ? `/dashboard/dealers/${row.id}`
                                : row.kind === "order"
                                  ? `/dashboard/orders/${row.id}`
                                  : "/dashboard/approvals"
                            }
                          >
                            {row.kind === "credit-note" ? "Review" : "View"}
                          </Link>
                        </Button>
                        {row.kind !== "credit-note" && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              row.kind === "dealer" ? approveDealer(row.id) : approveOrder(row.id)
                            }
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/approvals">View all approvals</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/80 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-brand-600" />
              Recent orders
            </CardTitle>
            <CardDescription>Latest order activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="flex items-center justify-between rounded-lg border border-transparent px-1 py-2 transition-colors hover:border-border hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.dealerName || order.dealer?.firmName || ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">{formatCurrency(order.totalAmount)}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/orders">View all orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-card">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Common tasks at your fingertips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {role === "SALES_MARKETING" && (
                <>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/dealers/new">
                      <Users className="h-5 w-5" />
                      <span className="text-xs font-medium">Add dealer</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/orders/new">
                      <ShoppingCart className="h-5 w-5" />
                      <span className="text-xs font-medium">New order</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/recommendations/new">
                      <Sprout className="h-5 w-5" />
                      <span className="text-xs font-medium">Recommendation</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/field">
                      <Clock className="h-5 w-5" />
                      <span className="text-xs font-medium">Field work</span>
                    </Link>
                  </Button>
                </>
              )}
              {role === "MANAGEMENT_ADMIN" && (
                <>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/approvals">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-xs font-medium">Approvals</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/reports">
                      <BarChart3 className="h-5 w-5" />
                      <span className="text-xs font-medium">Reports</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/dealers">
                      <Users className="h-5 w-5" />
                      <span className="text-xs font-medium">Dealers</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/orders">
                      <ShoppingCart className="h-5 w-5" />
                      <span className="text-xs font-medium">Orders</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="h-5 w-5" />
                      <span className="text-xs font-medium">Settings</span>
                    </Link>
                  </Button>
                </>
              )}
              {role === "PRODUCTION_LOGISTICS" && (
                <>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/logistics">
                      <Truck className="h-5 w-5" />
                      <span className="text-xs font-medium">Dispatch</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                    <Link href="/dashboard/finance/invoices">
                      <FileText className="h-5 w-5" />
                      <span className="text-xs font-medium">Invoices</span>
                    </Link>
                  </Button>
                </>
              )}
              {(role === "SALES_MARKETING" || role === "PRODUCTION_LOGISTICS" || role === "MANAGEMENT_ADMIN" || role === "ACCOUNT") && (
                <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                  <Link href="/dashboard/products">
                    <Package className="h-5 w-5" />
                    <span className="text-xs font-medium">Products</span>
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Alerts &amp; notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {role !== "MANAGEMENT_ADMIN" && (
                <Link
                  href="/dashboard/finance/invoices"
                  className="flex gap-3 rounded-lg border border-red-200 bg-red-50/80 p-3 transition-colors hover:bg-red-100"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <p className="font-medium text-red-900">Overdue payments</p>
                    <p className="text-sm text-red-700">Review invoices and follow up with dealers</p>
                  </div>
                </Link>
              )}
              {role !== "MANAGEMENT_ADMIN" && (
                <Link
                  href="/dashboard/inventory"
                  className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 transition-colors hover:bg-amber-100"
                >
                  <Package className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-900">Low stock</p>
                    <p className="text-sm text-amber-800">Check inventory levels and reorder</p>
                  </div>
                </Link>
              )}
              {role === "MANAGEMENT_ADMIN" && (
                <>
                  <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-900">Pending approvals</p>
                      <p className="text-sm text-amber-800">
                        {stats
                          ? `${stats.pendingDealerApprovals} dealers · ${stats.pendingOrders} orders · ${stats.pendingCreditNotes} credit notes`
                          : "Loading..."}
                      </p>
                      <Link
                        href="/dashboard/approvals"
                        className="mt-1 inline-block text-sm font-semibold text-amber-800 underline-offset-4 hover:underline"
                      >
                        Open approvals
                      </Link>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50/80 p-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <div>
                      <p className="font-medium text-red-900">Finance status</p>
                      <p className="text-sm text-red-700">
                        {stats
                          ? `${stats.overdueInvoices} overdue invoices · ${formatCurrency(stats.outstandingRevenue)} outstanding`
                          : "Loading..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50/80 p-3">
                    <Truck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Logistics status</p>
                      <p className="text-sm text-blue-800">
                        {stats
                          ? `${stats.pendingInvoiceDispatch} invoices · ${stats.pendingDispatch} orders ready · ${stats.activeDispatches} in transit`
                          : "Loading..."}
                      </p>
                    </div>
                  </div>
                  {stats && stats.lowStockCount > 0 && (
                    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
                      <Package className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-900">Inventory alert</p>
                        <p className="text-sm text-amber-800">{stats.lowStockCount} products below reorder level</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50/80 p-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <p className="font-medium text-brand-900">Monthly target</p>
                  <p className="text-sm text-brand-800">Track performance in Reports</p>
                  <Link
                    href="/dashboard/reports/sales"
                    className="mt-1 inline-block text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
                  >
                    Open sales report
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
