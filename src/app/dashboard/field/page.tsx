"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, NotebookPen, ClipboardCheck, Users, ClipboardList, Sunset, Radio } from "lucide-react";
import { TrackingBanner } from "@/components/field/TrackingBanner";

const actions = [
  {
    title: "Daily Activity Report",
    description: "Start-of-day plan: places, targets, demos",
    href: "/dashboard/field/activity",
    icon: ClipboardList,
    color: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    title: "Daily Closing Report",
    description: "End-of-day actuals vs today's plan",
    href: "/dashboard/field/closing",
    icon: Sunset,
    color: "bg-orange-50 text-orange-700 border-orange-100",
  },
  {
    title: "Daily work log",
    description: "Optional visit/travel notes",
    href: "/dashboard/field/daily-log",
    icon: NotebookPen,
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
  {
    title: "Dealer visit",
    description: "Log visit with location check-in",
    href: "/dashboard/field/visits/new",
    icon: MapPin,
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    title: "My tracking",
    description: "Opt in and view today's GPS trail",
    href: "/dashboard/field/tracking",
    icon: Radio,
    color: "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    title: "My history",
    description: "Past plans, closings, visits, and GPS",
    href: "/dashboard/field/history",
    icon: ClipboardCheck,
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
];

const teamAction = {
  title: "Team field activity",
  description: "Daily reports, visits, and live tracking",
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

      <TrackingBanner />

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
