"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Product Details</h1>
          <p className="text-muted-foreground">View and edit product information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product ID: {params.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Product detail page. Full functionality coming soon.
          </p>
          <div className="mt-4">
            <Link href="/dashboard/products">
              <Button variant="outline">Back to Products</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
