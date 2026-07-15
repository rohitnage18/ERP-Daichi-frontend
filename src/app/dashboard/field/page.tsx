"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, NotebookPen, Wallet, ClipboardCheck } from "lucide-react";

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

export default function FieldHubPage() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pb-8 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Field work</h1>
        <p className="mt-1 text-base sm:text-lg text-muted-foreground">
          Hello {session?.user?.name?.split(" ")[0] || "there"} — tap what you need today
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map((item) => (
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
                <Button size="lg" className="w-full h-12 sm:h-14 text-base" variant="secondary">
                  Open
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
