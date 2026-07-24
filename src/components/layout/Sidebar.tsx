"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/branding/Logo";
import { useNav } from "./NavContext";
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
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { name: "Field work", href: "/dashboard/field", icon: MapPinned, roles: ["SALES_MARKETING"] },
  { name: "Field team", href: "/dashboard/field/team", icon: MapPinned, roles: ["MANAGEMENT_ADMIN"] },
  { name: "Dealers", href: "/dashboard/dealers", icon: Users, roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "ACCOUNT"] },
  { name: "Products", href: "/dashboard/products", icon: Package, roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart, roles: ["SALES_MARKETING", "MANAGEMENT_ADMIN", "PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { name: "Billing", href: "/dashboard/billing", icon: Calculator, roles: ["ACCOUNT"] },
  { name: "Sales Promotion Activity", href: "/dashboard/recommendations", icon: Sprout, roles: ["SALES_MARKETING"] },
  { name: "Logistics", href: "/dashboard/logistics", icon: Truck, roles: ["PRODUCTION_LOGISTICS"] },
  { name: "Inventory", href: "/dashboard/inventory", icon: Warehouse, roles: ["PRODUCTION_LOGISTICS"] },
  { name: "Invoices", href: "/dashboard/finance/invoices", icon: FileText, roles: ["PRODUCTION_LOGISTICS", "ACCOUNT"] },
  { name: "Payments", href: "/dashboard/finance/payments", icon: CreditCard, roles: ["ACCOUNT"] },
  { name: "Credit Notes", href: "/dashboard/finance/credit-notes", icon: Receipt, roles: ["ACCOUNT"] },
  { name: "Debit Notes", href: "/dashboard/finance/debit-notes", icon: Receipt, roles: ["ACCOUNT"] },
  { name: "GSTN Export", href: "/dashboard/billing/export", icon: FileSpreadsheet, roles: ["ACCOUNT"] },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["MANAGEMENT_ADMIN"] },
  { name: "Approvals", href: "/dashboard/approvals", icon: ClipboardList, roles: ["MANAGEMENT_ADMIN"] },
  { name: "Email & invites", href: "/dashboard/settings/email", icon: Mail, roles: ["MANAGEMENT_ADMIN"] },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["MANAGEMENT_ADMIN"] },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "";
  const filteredNavigation = navigation.filter((item) => item.roles.includes(userRole));

  return (
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
            onClick={onNavigate}
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
  );
}

export function Sidebar() {
  const { mobileOpen, closeMobile } = useNav();

  return (
    <>
      {/* Desktop */}
      <aside className="app-sidebar hidden h-full w-64 shrink-0 flex-col border-r border-slate-800/80 bg-[hsl(222,47%,9%)] md:flex print:hidden">
        <div className="flex h-[4.25rem] items-center border-b border-slate-800/80 px-4">
          <Logo variant="sidebar" inverted className="scale-[0.98]" />
        </div>
        <NavLinks />
        <div className="border-t border-slate-800/80 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Daichi</p>
          <p className="text-xs text-slate-400">Daichi International</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden print:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          aria-label="Close menu"
          onClick={closeMobile}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col bg-[hsl(222,47%,9%)] shadow-xl transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-[4.25rem] items-center justify-between border-b border-slate-800/80 px-4">
            <Logo variant="sidebar" inverted className="scale-[0.98]" />
            <button
              type="button"
              onClick={closeMobile}
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <NavLinks onNavigate={closeMobile} />
          <div className="border-t border-slate-800/80 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Daichi</p>
            <p className="text-xs text-slate-400">Daichi International</p>
          </div>
        </aside>
      </div>
    </>
  );
}
