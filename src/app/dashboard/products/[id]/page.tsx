"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { canCreateProduct } from "@/lib/permissions";
import {
  ALTERNATE_UNIT_OPTIONS,
  GST_RATE_OPTIONS,
  PACKING_SIZES,
  PACKING_TYPE_OPTIONS,
  PackingType,
  UNIT_OF_MEASURE_OPTIONS,
  conversionLabel,
} from "@/lib/packaging";
import { ProductCategorySelect } from "@/components/products/ProductCategorySelect";

interface CategoryOption {
  id: string;
  label: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const canEdit = canCreateProduct(session?.user?.role);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStock, setSavingStock] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [stockRemaining, setStockRemaining] = useState(0);
  const [reorderLevel, setReorderLevel] = useState("10");
  const [stockInput, setStockInput] = useState("0");
  const [form, setForm] = useState({
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
    description: "",
    targetCrops: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    (async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiFetch("/api/product-categories"),
          apiFetch(`/api/products/${params.id}`),
        ]);
        const cats = await catRes.json();
        setCategories(Array.isArray(cats) ? cats : []);

        if (!prodRes.ok) {
          setNotFound(true);
          return;
        }
        const p = await prodRes.json();
        setStockRemaining(Number(p.stockRemaining) || 0);
        setStockInput(String(Number(p.stockRemaining) || 0));
        setReorderLevel(String(Number(p.reorderLevel) || 10));
        setForm({
          productCode: p.productCode || "",
          name: p.name || "",
          categoryId: p.categoryId?.toString?.() || p.subCategory?.category?.id || "",
          unitOfMeasure: p.unitOfMeasure || "Nos",
          hsnCode: p.hsnCode || "",
          packingType: (p.packingType as PackingType) || "",
          packingSize: p.packingSize || "",
          alternateUnit: p.alternateUnit || "Case",
          unitsPerAlternate: p.unitsPerAlternate != null ? String(p.unitsPerAlternate) : "",
          batchNumber: p.batchNumber || "",
          basePrice: p.basePrice != null ? String(p.basePrice) : "",
          mrp: p.mrp != null ? String(p.mrp) : "",
          gstRate: p.gstRate != null ? String(p.gstRate) : "5",
          description: p.description || "",
          targetCrops: p.targetCrops || "",
          status: p.status || "ACTIVE",
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const packingSizes = form.packingType ? PACKING_SIZES[form.packingType] : [];
  const conversion = conversionLabel(
    form.alternateUnit,
    form.unitsPerAlternate,
    form.unitOfMeasure,
    form.packingSize
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode: form.productCode,
          name: form.name,
          categoryId: form.categoryId || undefined,
          unitOfMeasure: form.unitOfMeasure,
          hsnCode: form.hsnCode || undefined,
          packingType: form.packingType || undefined,
          packingSize: form.packingSize || undefined,
          alternateUnit: form.alternateUnit || undefined,
          unitsPerAlternate: form.unitsPerAlternate ? Number(form.unitsPerAlternate) : undefined,
          batchNumber: form.batchNumber || undefined,
          basePrice: form.basePrice ? parseFloat(form.basePrice) : undefined,
          mrp: form.mrp ? parseFloat(form.mrp) : undefined,
          gstRate: form.gstRate ? parseFloat(form.gstRate) : undefined,
          description: form.description || undefined,
          targetCrops: form.targetCrops || undefined,
          status: form.status,
        }),
      });
      if (res.ok) {
        router.push("/dashboard/products");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not save product.");
      }
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStock = async () => {
    setSavingStock(true);
    try {
      const res = await apiFetch(`/api/inventory/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: parseFloat(stockInput) || 0,
          reorderLevel: parseFloat(reorderLevel) || 10,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStockRemaining(Number(data.stockRemaining) || 0);
        setStockInput(String(Number(data.stockRemaining) || 0));
        setReorderLevel(String(Number(data.reorderLevel) || 10));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not update stock.");
      }
    } catch {
      alert("Network error");
    } finally {
      setSavingStock(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{form.name || "Product"}</h1>
          <p className="text-muted-foreground">
            Stock remaining:{" "}
            <span className={stockRemaining <= Number(reorderLevel) ? "font-semibold text-amber-700" : "font-semibold"}>
              {stockRemaining} Nos
            </span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Remaining</CardTitle>
          <CardDescription>Warehouse quantity on hand (deducted on dispatch)</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Current stock (Nos)</Label>
            <Input
              type="number"
              min={0}
              value={stockInput}
              disabled={!canEdit}
              onChange={(e) => setStockInput(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Reorder level</Label>
            <Input
              type="number"
              min={0}
              value={reorderLevel}
              disabled={!canEdit}
              onChange={(e) => setReorderLevel(e.target.value)}
            />
          </div>
          {canEdit && (
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={handleSaveStock} disabled={savingStock}>
                {savingStock && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update stock
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Product Code</Label>
            <Input
              value={form.productCode}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, productCode: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input
              value={form.name}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <ProductCategorySelect
              categories={categories}
              value={form.categoryId}
              onChange={(v) => setForm({ ...form, categoryId: v })}
              disabled={!canEdit}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>HSN / SAC Code</Label>
            <Input
              value={form.hsnCode}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Product Packaging</CardTitle>
          <CardDescription>Packing size and alternate (bulk) unit conversion</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Unit of Measure</Label>
            <Select
              value={form.unitOfMeasure}
              onValueChange={(v) => setForm({ ...form, unitOfMeasure: v })}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
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
              value={form.packingType}
              onValueChange={(v) =>
                setForm({ ...form, packingType: v as PackingType, packingSize: "" })
              }
              disabled={!canEdit}
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
              value={form.packingSize}
              onValueChange={(v) => setForm({ ...form, packingSize: v })}
              disabled={!canEdit || !form.packingType}
            >
              <SelectTrigger>
                <SelectValue placeholder={form.packingType ? "Select size" : "Pick category first"} />
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
            <Label>Batch Number</Label>
            <Input
              value={form.batchNumber}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Alternate Unit</Label>
            <Select
              value={form.alternateUnit}
              onValueChange={(v) => setForm({ ...form, alternateUnit: v })}
              disabled={!canEdit}
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
          <div className="space-y-2">
            <Label>Units per {form.alternateUnit || "Alternate"}</Label>
            <Input
              type="number"
              min={1}
              value={form.unitsPerAlternate}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, unitsPerAlternate: e.target.value })}
              placeholder="e.g. 6"
            />
          </div>
          {conversion && (
            <p className="md:col-span-2 text-sm font-medium text-brand-700">{conversion}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & Tax</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Base Price (₹)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.basePrice}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>MRP (₹)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.mrp}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, mrp: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>GST Rate (%)</Label>
            <Select
              value={form.gstRate}
              onValueChange={(v) => setForm({ ...form, gstRate: v })}
              disabled={!canEdit}
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
          <div className="space-y-2 md:col-span-3">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex justify-end gap-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save changes
          </Button>
        </div>
      )}
    </div>
  );
}
