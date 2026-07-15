"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Users, ShoppingCart, IndianRupee, MapPinned, Mail } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

const reports = [
  {
    title: "Sales Report",
    description: "Zone-wise sales from live orders",
    icon: BarChart3,
    href: "/dashboard/reports/sales",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Aging Report",
    description: "Outstanding payments by aging buckets",
    icon: IndianRupee,
    href: "/dashboard/reports/aging",
    color: "bg-red-100 text-red-600",
  },
  {
    title: "Team field activity",
    description: "Daily logs, visits, GPS, allowances",
    icon: MapPinned,
    href: "/dashboard/field/team",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Monthly email report",
    description: "Send management summary by email",
    icon: Mail,
    href: "/dashboard/settings/email",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    title: "Order Summary",
    description: "View all orders with filters",
    icon: FileText,
    href: "/dashboard/orders",
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Dealers",
    description: "Dealer list and performance",
    icon: Users,
    href: "/dashboard/dealers",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Products",
    description: "Indicafert catalog and pricing",
    icon: ShoppingCart,
    href: "/dashboard/products",
    color: "bg-purple-100 text-purple-600",
  },
];

export default function ReportsPage() {
  const [stats, setStats] = useState<{
    ordersThisMonth: number;
    revenueMtd: number;
    pendingDealerApprovals: number;
    overdueInvoices: number;
  } | null>(null);

  useEffect(() => {
    apiFetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Business reports from your live database</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${report.color}`}>
                <report.icon className="h-6 w-6" />
              </div>
              <CardTitle className="mt-4">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href={report.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This month (live)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Orders</p>
              <p className="text-2xl font-bold">{stats?.ordersThisMonth ?? "—"}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Revenue</p>
              <p className="text-2xl font-bold">
                {stats ? formatCurrency(stats.revenueMtd) : "—"}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600">Pending dealer approvals</p>
              <p className="text-2xl font-bold">{stats?.pendingDealerApprovals ?? "—"}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Overdue invoices</p>
              <p className="text-2xl font-bold">{stats?.overdueInvoices ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
