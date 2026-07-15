"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { HeaderBackButton } from "@/components/shared/BackButton";
import { Loader2 } from "lucide-react";
import { isPathBlockedForRole } from "@/lib/permissions";

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

    if (isPathBlockedForRole(pathname, role)) {
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

  // Avoid flashing blocked pages before redirect
  if (isPathBlockedForRole(pathname, session.user?.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-9 w-9 animate-spin text-brand-600" />
      </div>
    );
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
