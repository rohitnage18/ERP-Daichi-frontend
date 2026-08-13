"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditDealerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Dealer</h1>
        <p className="text-muted-foreground">Update dealer information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Edit functionality coming soon. Please use the dealer creation form as reference.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
