"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";

interface SubCategoryOption {
  id: string;
  label: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<SubCategoryOption[]>([]);
  const [formData, setFormData] = useState({
    productCode: "",
    name: "",
    subCategoryId: "",
    unitOfMeasure: "",
    basePrice: "",
    gstRate: "",
    description: "",
    targetCrops: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/product-categories");
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode: formData.productCode,
          name: formData.name,
          categoryId: formData.subCategoryId || undefined,
          unitOfMeasure: formData.unitOfMeasure,
          basePrice: parseFloat(formData.basePrice),
          gstRate: parseFloat(formData.gstRate),
          description: formData.description || undefined,
          targetCrops: formData.targetCrops || undefined,
        }),
      });
      if (res.ok) {
        router.push("/dashboard/products");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not create product. Check all fields.");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">Add a new product to the catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Enter product information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productCode">Product Code *</Label>
                <Input
                  id="productCode"
                  value={formData.productCode}
                  onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                  placeholder="XV-NPK-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.subCategoryId}
                  onValueChange={(value) => setFormData({ ...formData, subCategoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                <Select
                  value={formData.unitOfMeasure}
                  onValueChange={(value) => setFormData({ ...formData, unitOfMeasure: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kg">Kilogram (Kg)</SelectItem>
                    <SelectItem value="Ltr">Litre (Ltr)</SelectItem>
                    <SelectItem value="Packet">Packet</SelectItem>
                    <SelectItem value="Bag">Bag</SelectItem>
                    <SelectItem value="Gm">Gram (Gm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price (₹) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstRate">GST Rate (%) *</Label>
                <Select
                  value={formData.gstRate}
                  onValueChange={(value) => setFormData({ ...formData, gstRate: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="targetCrops">Target Crops</Label>
                <Input
                  id="targetCrops"
                  value={formData.targetCrops}
                  onChange={(e) => setFormData({ ...formData, targetCrops: e.target.value })}
                  placeholder="e.g., Cotton, Vegetables, Grapes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/products">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Product
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
