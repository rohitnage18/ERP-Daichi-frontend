"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const roleLabels: Record<string, string> = {
  SALES_MARKETING: "Sales & Marketing",
  MANAGEMENT_ADMIN: "Management / Admin",
  PRODUCTION_LOGISTICS: "Production & Logistics",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return (
      <div className="flex justify-center py-16">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      <Card className="border-border/80 shadow-card">
        <CardHeader>
          <CardTitle>Your account</CardTitle>
          <CardDescription>Information from your login session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-border py-2">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between border-b border-border py-2">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between border-b border-border py-2">
            <span className="text-muted-foreground">Employee ID</span>
            <span className="font-mono font-medium">{user?.employeeId}</span>
          </div>
          <div className="flex justify-between border-b border-border py-2">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{user?.role ? roleLabels[user.role] : "—"}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Zone</span>
            <span className="font-medium">{user?.zoneName || "All zones"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
