"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { HeaderBackButton } from "@/components/shared/BackButton";
import { Loader2 } from "lucide-react";

const roleBlockedPrefixes: Record<string, string[]> = {
  MANAGEMENT_ADMIN: [
    "/dashboard/field",
    "/dashboard/recommendations",
    "/dashboard/billing",
    "/dashboard/logistics",
    "/dashboard/inventory",
    "/dashboard/finance",
    "/dashboard/dealers/new",
    "/dashboard/orders/new",
  ],
  PRODUCTION_LOGISTICS: [
    "/dashboard/field",
    "/dashboard/recommendations",
    "/dashboard/billing",
    "/dashboard/dealers/new",
    "/dashboard/orders/new",
    "/dashboard/approvals",
    "/dashboard/settings",
  ],
  ACCOUNT: [
    "/dashboard/field",
    "/dashboard/recommendations",
    "/dashboard/logistics",
    "/dashboard/inventory",
    "/dashboard/approvals",
    "/dashboard/settings",
    "/dashboard/products/new",
    "/dashboard/orders/new",
  ],
  SALES_MARKETING: [
    "/dashboard/billing",
    "/dashboard/logistics",
    "/dashboard/inventory",
    "/dashboard/approvals",
    "/dashboard/settings",
  ],
};

function isPathBlocked(pathname: string, blockedPrefixes: string[]) {
  return blockedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const role = session?.user?.role as string | undefined;
    if (!role || !pathname) return;

    const blocked = roleBlockedPrefixes[role];
    if (blocked && isPathBlocked(pathname, blocked)) {
      router.replace("/dashboard");
    }
  }, [session, pathname, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-9 w-9 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen bg-muted/40 print:block print:h-auto print:bg-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden print:block print:overflow-visible">
        <Header />
        <HeaderBackButton />
        <main className="app-main flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/30 p-6 print:overflow-visible print:bg-white print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
