"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, NotebookPen, Wallet, ClipboardCheck, Users } from "lucide-react";

const actions = [
  {
    title: "Daily work log",
    description: "Record today's visits, travel, and summary",
    href: "/dashboard/field/daily-log",
    icon: NotebookPen,
    color: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    title: "Dealer visit",
    description: "Log visit with location check-in",
    href: "/dashboard/field/visits/new",
    icon: MapPin,
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    title: "Allowance claim",
    description: "Submit travel or daily allowance",
    href: "/dashboard/field/allowances/new",
    icon: Wallet,
    color: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    title: "My history",
    description: "View past logs, visits, and claims",
    href: "/dashboard/field/history",
    icon: ClipboardCheck,
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
];

const teamAction = {
  title: "Team field activity",
  description: "Daily logs, visits, GPS, allowances for the sales team",
  href: "/dashboard/field/team",
  icon: Users,
  color: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export default function FieldHubPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "MANAGEMENT_ADMIN";
  const items = isAdmin ? [teamAction, ...actions] : actions;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Field work</h1>
        <p className="mt-1 text-base sm:text-lg text-muted-foreground">
          Hello {session?.user?.name?.split(" ")[0] || "there"} — tap what you need today
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className={`h-full cursor-pointer border-2 transition-shadow active:scale-[0.98] hover:shadow-md ${item.color}`}>
              <CardHeader className="pb-2">
                <item.icon className="mb-2 h-10 w-10" />
                <CardTitle className="text-lg sm:text-xl">{item.title}</CardTitle>
                <CardDescription className="text-sm sm:text-base text-inherit opacity-80">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex h-12 w-full items-center justify-center rounded-md bg-secondary px-8 text-base font-medium text-secondary-foreground sm:h-14">
                  Open
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
