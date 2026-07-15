"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function EditDealerPage() {
  const params = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/dealers/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Dealer</h1>
          <p className="text-muted-foreground">Update dealer information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Edit functionality coming soon. Please use the dealer creation form as reference.
          </p>
          <div className="mt-4">
            <Link href={`/dashboard/dealers/${params.id}`}>
              <Button variant="outline">Back to Dealer</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
