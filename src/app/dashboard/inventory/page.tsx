"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Warehouse, AlertTriangle, Loader2, Upload } from "lucide-react";

interface InventoryItem {
  id: string;
  productId?: string;
  quantity: number;
  reorderLevel: number;
  warehouseCode: string;
  lastUpdated: string;
  product: {
    productCode: string;
    name: string;
    packingSize?: string;
    packingType?: string;
    packingUnit?: string;
    unitOfMeasure: string;
    subCategory: {
      name: string;
    };
  };
}

function isLiquidProduct(item: InventoryItem): boolean {
  if (item.product.packingType === "LIQUID") return true;
  if (item.product.packingType === "POWDER_GRANULES") return false;
  const blob = [
    item.product.packingSize,
    item.product.packingUnit,
    item.product.unitOfMeasure,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\b(ml|ltr|lit|litre|liter)\b/.test(blob);
}

function StockTable({
  items,
  canEdit,
  savingId,
  onSave,
}: {
  items: InventoryItem[];
  canEdit: boolean;
  savingId: string | null;
  onSave: (item: InventoryItem, quantity: number) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No products in this group</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product Code</TableHead>
          <TableHead>Product Name</TableHead>
          <TableHead>Packing</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Warehouse</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Reorder Level</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const isLowStock = item.quantity <= item.reorderLevel;
          const draft = drafts[item.id] ?? String(item.quantity);
          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.product.productCode}</TableCell>
              <TableCell>{item.product.name}</TableCell>
              <TableCell className="text-sm">{item.product.packingSize || "—"}</TableCell>
              <TableCell>{item.product.subCategory.name}</TableCell>
              <TableCell>{item.warehouseCode}</TableCell>
              <TableCell className="text-right">
                {canEdit ? (
                  <div className="flex items-center justify-end gap-2">
                    <Input
                      type="number"
                      min={0}
                      className="h-8 w-24 text-right"
                      value={draft}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    />
                    <span className="text-xs text-muted-foreground">{item.product.unitOfMeasure}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingId === item.id || Number(draft) === item.quantity}
                      onClick={() => onSave(item, Math.max(0, Number(draft) || 0))}
                    >
                      {savingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                ) : (
                  <>
                    {item.quantity.toLocaleString()} {item.product.unitOfMeasure}
                  </>
                )}
              </TableCell>
              <TableCell className="text-right">{item.reorderLevel.toLocaleString()}</TableCell>
              <TableCell>
                {isLowStock ? (
                  <Badge variant="destructive" className="flex w-fit items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Low Stock
                  </Badge>
                ) : (
                  <Badge variant="success">In Stock</Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const canEdit =
    session?.user?.role === "PRODUCTION_LOGISTICS" ||
    session?.user?.role === "MANAGEMENT_ADMIN";
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    rowsSucceeded: number;
    rowsFailed: number;
    errors: { row: number; sku?: string; error: string }[];
  } | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const canUpload = canEdit;

  useEffect(() => {
    fetchInventory();
    apiFetch("/api/inventory/movements")
      .then((r) => r.json())
      .then((d) => setMovements(Array.isArray(d) ? d : []))
      .catch(() => setMovements([]));
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await apiFetch("/api/inventory");
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.product.name.toLowerCase().includes(search.toLowerCase()) ||
      item.product.productCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const fileBase64 = dataUrl.split(",")[1] || "";
      const res = await apiFetch("/api/inventory/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileBase64 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Upload failed");
        return;
      }
      setUploadResult(data);
      await fetchInventory();
      const ledger = await apiFetch("/api/inventory/movements");
      setMovements(await ledger.json());
    } catch {
      alert("Could not read file");
    } finally {
      setUploading(false);
    }
  };

  const saveStock = async (item: InventoryItem, quantity: number) => {
    const targetId = item.productId || item.id;
    setSavingId(item.id);
    try {
      const res = await apiFetch(`/api/inventory/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        setInventory((prev) =>
          prev.map((row) =>
            row.id === item.id ? { ...row, quantity: Number(data.quantity) || 0 } : row
          )
        );
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not update stock.");
      }
    } catch {
      alert("Network error");
    } finally {
      setSavingId(null);
    }
  };

  const kgStock = filteredInventory.filter((item) => !isLiquidProduct(item));
  const ltrStock = filteredInventory.filter((item) => isLiquidProduct(item));
  const lowStockCount = inventory.filter((item) => item.quantity <= item.reorderLevel).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Monitor stock levels by packing — Kg and Litre separately</p>
      </div>

      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk upload</CardTitle>
            <CardDescription>CSV or Excel with columns SKU (or Product Code) and Quantity. Valid rows update stock; bad rows are reported.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Choose file"}
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
            {uploadResult && (
              <div className="text-sm">
                <p>
                  Succeeded {uploadResult.rowsSucceeded} · Failed {uploadResult.rowsFailed}
                </p>
                {uploadResult.errors?.length > 0 && (
                  <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5 text-red-700">
                    {uploadResult.errors.map((err, i) => (
                      <li key={i}>
                        Row {err.row}
                        {err.sku ? ` (${err.sku})` : ""}: {err.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Warehouse className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kgStock.length}</p>
                <p className="text-sm text-muted-foreground">Kg products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Warehouse className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ltrStock.length}</p>
                <p className="text-sm text-muted-foreground">Ltr products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Kg stock</CardTitle>
              <CardDescription>Powder and granule products (Kg / Gm packing)</CardDescription>
            </CardHeader>
            <CardContent>
              <StockTable items={kgStock} canEdit={canEdit} savingId={savingId} onSave={saveStock} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ltr stock</CardTitle>
              <CardDescription>Liquid products (Litre / ml packing)</CardDescription>
            </CardHeader>
            <CardContent>
              <StockTable items={ltrStock} canEdit={canEdit} savingId={savingId} onSave={saveStock} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory ledger</CardTitle>
              <CardDescription>Invoice deductions, reversals, uploads, and manual edits</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 40).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{m.createdAt ? new Date(m.createdAt).toLocaleString("en-IN") : "—"}</TableCell>
                      <TableCell>{m.sku || m.productName}</TableCell>
                      <TableCell>{m.type}</TableCell>
                      <TableCell className="text-right tabular-nums">{m.quantity}</TableCell>
                      <TableCell className="text-xs">{m.invoiceNumber || m.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {movements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        No movements yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
