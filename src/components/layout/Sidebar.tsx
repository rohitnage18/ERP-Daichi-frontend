"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/branding/Logo";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Truck,
  Warehouse,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  Sprout,
  ClipboardList,
  MapPinned,
  Mail,
  FileSpreadsheet,
  Calculator,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { name: "Field work", href: "/dashboard/field", icon: MapPinned, roles: ["SALES_MARKETING"] },
  { name: "Field team", href: "/dashboard/field/team", icon: MapPinned, roles: ["MANAGEMENT_ADMIN"] },
  { name: "Dealers", href: "/dashboard/dealers", icon: Users, roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "ACCOUNT"] },
  { name: "Products", href: "/dashboard/products", icon: Package, roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart, roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { name: "Billing", href: "/dashboard/billing", icon: Calculator, roles: ["ACCOUNT"] },
  { name: "Recommendations", href: "/dashboard/recommendations", icon: Sprout, roles: ["SALES_MARKETING"] },
  { name: "Logistics", href: "/dashboard/logistics", icon: Truck, roles: ["PRODUCTION_LOGISTICS"] },
  { name: "Inventory", href: "/dashboard/inventory", icon: Warehouse, roles: ["PRODUCTION_LOGISTICS"] },
  { name: "Invoices", href: "/dashboard/finance/invoices", icon: FileText, roles: ["PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { name: "Payments", href: "/dashboard/finance/payments", icon: CreditCard, roles: ["ACCOUNT"] },
  { name: "Credit Notes", href: "/dashboard/finance/credit-notes", icon: Receipt, roles: ["ACCOUNT"] },
  { name: "GSTN Export", href: "/dashboard/billing/export", icon: FileSpreadsheet, roles: ["ACCOUNT"] },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["MANAGEMENT_ADMIN"] },
  { name: "Approvals", href: "/dashboard/approvals", icon: ClipboardList, roles: ["MANAGEMENT_ADMIN"] },
  { name: "Email & invites", href: "/dashboard/settings/email", icon: Mail, roles: ["MANAGEMENT_ADMIN"] },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["MANAGEMENT_ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "";

  const filteredNavigation = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <div className="app-sidebar flex h-full w-64 flex-col border-r border-slate-800/80 bg-[hsl(222,47%,9%)] print:hidden">
      <div className="flex h-[4.25rem] items-center border-b border-slate-800/80 px-4">
        <Logo variant="sidebar" inverted className="scale-[0.98]" />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 no-scrollbar">
        {filteredNavigation.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/90 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800/80 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Daichi</p>
        <p className="text-xs text-slate-400">Daichi International</p>
      </div>
    </div>
  );
}
