"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RevenueReportPage() {
  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-3xl font-bold">Revenue Trends Report</h1>
          <p className="text-muted-foreground">Monthly and quarterly revenue analysis</p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Detailed revenue trends report coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
