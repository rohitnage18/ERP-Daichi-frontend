"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderReportPage() {
  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-3xl font-bold">Order Summary Report</h1>
          <p className="text-muted-foreground">Order status and fulfillment metrics</p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Detailed order summary report coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
