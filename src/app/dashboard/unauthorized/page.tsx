"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldOff className="h-10 w-10 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Not authorized</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your role cannot open this page. Go back to the dashboard for the modules assigned to you.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
