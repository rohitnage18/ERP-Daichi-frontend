"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CategoriesPage() {
  const [hint, setHint] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Categories</h1>
          <p className="text-muted-foreground">Manage product categories and sub-categories</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setHint("New categories are created when you add products. Use Products → New and pick a category / sub-category.");
            setTimeout(() => setHint(null), 6000);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add category
        </Button>
      </div>

      {hint && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">{hint}</span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/products/new">Open new product</Link>
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Fertilizers</h3>
              <p className="text-sm text-muted-foreground">NPK Fertilizers, Organic Fertilizers, Micronutrients</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Pesticides</h3>
              <p className="text-sm text-muted-foreground">Insecticides, Fungicides, Herbicides</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Seeds</h3>
              <p className="text-sm text-muted-foreground">Vegetable Seeds, Field Crop Seeds</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
