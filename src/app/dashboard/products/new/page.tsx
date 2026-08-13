"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Save } from "lucide-react";
import {
  ALTERNATE_UNIT_OPTIONS,
  GST_RATE_OPTIONS,
  PACKING_SIZES,
  PACKING_TYPE_OPTIONS,
  PackingType,
  UNIT_OF_MEASURE_OPTIONS,
} from "@/lib/packaging";
import { ProductCategorySelect } from "@/components/products/ProductCategorySelect";
import {
  PackingDerivedFields,
  packingUnitsError,
} from "@/components/products/PackingDerivedFields";

interface CategoryOption {
  id: string;
  label: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [formData, setFormData] = useState({
    productCode: "",
    name: "",
    categoryId: "",
    unitOfMeasure: "Nos",
    hsnCode: "",
    packingType: "" as "" | PackingType,
    packingSize: "",
    alternateUnit: "Case",
    unitsPerAlternate: "",
    batchNumber: "",
    basePrice: "",
    mrp: "",
    gstRate: "5",
    openingStock: "0",
    reorderLevel: "10",
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

  const packingSizes = formData.packingType ? PACKING_SIZES[formData.packingType] : [];
  const unitsPerCaseError = packingUnitsError(formData.unitsPerAlternate);
  const pricePerUnit = formData.basePrice ? parseFloat(formData.basePrice) : null;

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
          categoryId: formData.categoryId || undefined,
          unitOfMeasure: formData.unitOfMeasure,
          hsnCode: formData.hsnCode || undefined,
          packingType: formData.packingType || undefined,
          packingSize: formData.packingSize || undefined,
          alternateUnit: formData.alternateUnit || undefined,
          unitsPerAlternate: formData.unitsPerAlternate
            ? Number(formData.unitsPerAlternate)
            : undefined,
          batchNumber: formData.batchNumber || undefined,
          basePrice: parseFloat(formData.basePrice),
          mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
          gstRate: parseFloat(formData.gstRate),
          openingStock: parseFloat(formData.openingStock) || 0,
          reorderLevel: parseFloat(formData.reorderLevel) || 10,
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
      <div>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">Add a new product to the catalog</p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Basic identification and category</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productCode">Product Code *</Label>
              <Input
                id="productCode"
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                placeholder="DI-NPK-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Indicafert NPK 09:46:00+TE- 2.5 Kg"
                required
              />
            </div>
            <div className="md:col-span-2">
              <ProductCategorySelect
                categories={categories}
                value={formData.categoryId}
                onChange={(value) => setFormData({ ...formData, categoryId: value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hsnCode">HSN / SAC Code</Label>
              <Input
                id="hsnCode"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                placeholder="e.g. 31056000"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Packaging & Units</CardTitle>
            <CardDescription>
              Unit of measure, packing size, and the alternate (bulk) unit conversion
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit of Measure *</Label>
              <Select
                value={formData.unitOfMeasure}
                onValueChange={(value) => setFormData({ ...formData, unitOfMeasure: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OF_MEASURE_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Packing Category</Label>
              <Select
                value={formData.packingType}
                onValueChange={(value) =>
                  setFormData({ ...formData, packingType: value as PackingType, packingSize: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Liquid / Powder-Granules" />
                </SelectTrigger>
                <SelectContent>
                  {PACKING_TYPE_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Packing Size</Label>
              <Select
                value={formData.packingSize}
                onValueChange={(value) => setFormData({ ...formData, packingSize: value })}
                disabled={!formData.packingType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.packingType ? "Select size" : "Pick category first"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {packingSizes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="e.g. B-2026-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Alternate Unit</Label>
              <Select
                value={formData.alternateUnit}
                onValueChange={(value) => setFormData({ ...formData, alternateUnit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Case / Box / Bag" />
                </SelectTrigger>
                <SelectContent>
                  {ALTERNATE_UNIT_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <PackingDerivedFields
              packingSize={formData.packingSize}
              unitsPerCase={formData.unitsPerAlternate}
              pricePerUnit={Number.isFinite(pricePerUnit as number) ? pricePerUnit : null}
              onUnitsPerCaseChange={(value) =>
                setFormData({ ...formData, unitsPerAlternate: value })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Tax</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price (₹) *</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP (₹)</Label>
              <Input
                id="mrp"
                type="number"
                step="0.01"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>GST Rate (%) *</Label>
              <Select
                value={formData.gstRate}
                onValueChange={(value) => setFormData({ ...formData, gstRate: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GST_RATE_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="openingStock">Opening Stock (Nos)</Label>
              <Input
                id="openingStock"
                type="number"
                min={0}
                value={formData.openingStock}
                onChange={(e) => setFormData({ ...formData, openingStock: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                type="number"
                min={0}
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                placeholder="10"
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="targetCrops">Target Crops</Label>
              <Input
                id="targetCrops"
                value={formData.targetCrops}
                onChange={(e) => setFormData({ ...formData, targetCrops: e.target.value })}
                placeholder="e.g., Cotton, Vegetables, Grapes"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={loading || Boolean(unitsPerCaseError)}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Product
          </Button>
        </div>
      </form>
    </div>
  );
}
