"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { includesQuery } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Warehouse, AlertTriangle, Loader2, Upload, Plus } from "lucide-react";

interface InventoryItem {
  id: string;
  productId?: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  displayCases?: number;
  unitsPerCase?: number;
  baseUnit?: string;
  reorderLevel: number;
  warehouseCode: string;
  lastUpdated: string;
  lowStock?: boolean;
  zeroStock?: boolean;
  product: {
    productCode: string;
    name: string;
    packingSize?: string;
    packingType?: string;
    packingUnit?: string;
    unitOfMeasure: string;
    unitsPerAlternate?: number;
    subCategory: {
      name: string;
    };
  };
}

function isLiquidProduct(item: InventoryItem): boolean {
  const product = item.product;
  if (!product) return false;
  if (product.packingType === "LIQUID") return true;
  if (product.packingType === "POWDER_GRANULES") return false;
  const blob = [product.packingSize, product.packingUnit, product.unitOfMeasure]
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
  onSelectProduct,
}: {
  items: InventoryItem[];
  canEdit: boolean;
  savingId: string | null;
  onSave: (item: InventoryItem, quantity: number) => void;
  onSelectProduct: (productId: string) => void;
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
          <TableHead className="text-right">On hand</TableHead>
          <TableHead className="text-right">Reserved</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead className="text-right">Cases</TableHead>
          <TableHead className="text-right">Units/Case</TableHead>
          <TableHead>WH</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const isLow = item.lowStock ?? item.quantity <= item.reorderLevel;
          const isZero = item.zeroStock ?? item.quantity <= 0;
          const draft = drafts[item.id] ?? String(item.quantity);
          const upc = item.unitsPerCase || item.product?.unitsPerAlternate || 1;
          const cases = item.displayCases ?? Math.floor(item.quantity / upc + 0.5);
          const base = item.baseUnit || (item.product?.unitOfMeasure?.toLowerCase() === "kg" ? "KG" : "Nos");
          const reserved = item.reservedQuantity ?? 0;
          const available = item.availableQuantity ?? Math.max(0, item.quantity - reserved);
          return (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              onClick={() => onSelectProduct(item.productId || item.id)}
            >
              <TableCell className="font-medium">{item.product?.productCode || "—"}</TableCell>
              <TableCell>{item.product?.name || "Unknown"}</TableCell>
              <TableCell className="text-sm">{item.product?.packingSize || "—"}</TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                {canEdit ? (
                  <div className="flex items-center justify-end gap-2">
                    <Input
                      type="number"
                      min={0}
                      className="h-8 w-24 text-right"
                      value={draft}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    />
                    <span className="text-xs text-muted-foreground">{base}</span>
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
                    {item.quantity.toLocaleString()} {base}
                  </>
                )}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{reserved.toLocaleString()}</TableCell>
              <TableCell className="text-right font-medium">{available.toLocaleString()}</TableCell>
              <TableCell className="text-right font-medium">{cases.toLocaleString()}</TableCell>
              <TableCell className="text-right text-muted-foreground">{upc}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{item.warehouseCode || "—"}</TableCell>
              <TableCell>
                {isZero ? (
                  <Badge variant="destructive">Zero</Badge>
                ) : isLow ? (
                  <Badge variant="destructive" className="flex w-fit items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Low
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
    session?.user?.role === "PRODUCTION_LOGISTICS" || session?.user?.role === "MANAGEMENT_ADMIN";
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [grandTotalCases, setGrandTotalCases] = useState(0);
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
  const [historyProductId, setHistoryProductId] = useState<string>("all");
  const [inwardProductId, setInwardProductId] = useState("");
  const [inwardQty, setInwardQty] = useState("");
  const [inwardUnit, setInwardUnit] = useState("CASE");
  const [inwardDate, setInwardDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [inwardRemarks, setInwardRemarks] = useState("");
  const [inwardSaving, setInwardSaving] = useState(false);
  const [xferProductId, setXferProductId] = useState("");
  const [xferQty, setXferQty] = useState("");
  const [xferFrom, setXferFrom] = useState("MAIN");
  const [xferTo, setXferTo] = useState("WH-2");
  const [xferRemarks, setXferRemarks] = useState("");
  const [xferSaving, setXferSaving] = useState(false);
  const canUpload = canEdit;

  useEffect(() => {
    fetchInventory();
    loadMovements();
  }, []);

  const loadMovements = async (productId?: string) => {
    const q = productId && productId !== "all" ? `?productId=${productId}` : "";
    const r = await apiFetch(`/api/inventory/movements${q}`);
    const d = await r.json();
    setMovements(Array.isArray(d) ? d : []);
  };

  const fetchInventory = async () => {
    try {
      const res = await apiFetch("/api/inventory");
      const data = await res.json();
      if (Array.isArray(data)) {
        setInventory(data);
        setGrandTotalCases(0);
      } else {
        setInventory(Array.isArray(data.items) ? data.items : []);
        setGrandTotalCases(Number(data.grandTotalCases) || 0);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter((item) =>
    includesQuery(item?.product?.name, search) || includesQuery(item?.product?.productCode, search)
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
      await loadMovements(historyProductId);
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
        await fetchInventory();
        await loadMovements(historyProductId);
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

  const submitInward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardProductId) {
      alert("Select a product");
      return;
    }
    setInwardSaving(true);
    try {
      const res = await apiFetch("/api/inventory/inward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: inwardProductId,
          quantity: Number(inwardQty),
          unit: inwardUnit,
          date: inwardDate,
          remarks: inwardRemarks || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Could not add stock");
        return;
      }
      setInwardQty("");
      setInwardRemarks("");
      await fetchInventory();
      await loadMovements(historyProductId);
    } finally {
      setInwardSaving(false);
    }
  };

  const submitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xferProductId) {
      alert("Select a product");
      return;
    }
    setXferSaving(true);
    try {
      const res = await apiFetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: xferProductId,
          quantity: Number(xferQty),
          fromWarehouse: xferFrom,
          toWarehouse: xferTo,
          remarks: xferRemarks || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Could not transfer stock");
        return;
      }
      setXferQty("");
      setXferRemarks("");
      await fetchInventory();
      await loadMovements(historyProductId);
    } finally {
      setXferSaving(false);
    }
  };

  const kgStock = filteredInventory.filter((item) => !isLiquidProduct(item));
  const ltrStock = filteredInventory.filter((item) => isLiquidProduct(item));
  const lowStockCount = inventory.filter((item) => item.quantity <= item.reorderLevel).length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">
          Finished goods in base units (Nos / KG). Cases are Tally-style rounded display only.
        </p>
      </div>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add stock (inward)
            </CardTitle>
            <CardDescription>
              Adds to on-hand quantity and writes an INWARD ledger entry. Enter Cases or Nos/KG.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitInward} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1 lg:col-span-2">
                <Label>Product</Label>
                <Select value={inwardProductId} onValueChange={setInwardProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {inventory.map((item) => (
                      <SelectItem key={item.id} value={item.productId || item.id}>
                        {item.product?.productCode || "—"} — {item.product?.name || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  required
                  value={inwardQty}
                  onChange={(e) => setInwardQty(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select value={inwardUnit} onValueChange={setInwardUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASE">Case</SelectItem>
                    <SelectItem value="NOS">Nos</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={inwardDate} onChange={(e) => setInwardDate(e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                <Label>Remarks</Label>
                <Input value={inwardRemarks} onChange={(e) => setInwardRemarks(e.target.value)} placeholder="Optional" />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={inwardSaving} className="w-full">
                  {inwardSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add stock"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Warehouse transfer
            </CardTitle>
            <CardDescription>
              Move available stock between warehouse codes. Reserved qty stays on the source until released.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitTransfer} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1 lg:col-span-2">
                <Label>Product</Label>
                <Select value={xferProductId} onValueChange={setXferProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {inventory.map((item) => (
                      <SelectItem key={`xfer-${item.id}`} value={item.productId || item.id}>
                        {item.product?.productCode || "—"} — {item.warehouseCode || "MAIN"} (
                        {(item.availableQuantity ?? item.quantity).toLocaleString()} avail)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Qty (base)</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  required
                  value={xferQty}
                  onChange={(e) => setXferQty(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>From WH</Label>
                <Input value={xferFrom} onChange={(e) => setXferFrom(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>To WH</Label>
                <Input value={xferTo} onChange={(e) => setXferTo(e.target.value)} required />
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                <Label>Remarks</Label>
                <Input value={xferRemarks} onChange={(e) => setXferRemarks(e.target.value)} placeholder="Optional" />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={xferSaving} className="w-full">
                  {xferSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Transfer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk upload</CardTitle>
            <CardDescription>
              CSV/Excel with SKU and Quantity. Sets absolute base qty (ADJUSTMENT), not an inward add.
            </CardDescription>
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
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Warehouse className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{grandTotalCases.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Grand total cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{kgStock.length}</p>
            <p className="text-sm text-muted-foreground">Kg / powder SKUs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{ltrStock.length}</p>
            <p className="text-sm text-muted-foreground">Litre / liquid SKUs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-amber-700">{lowStockCount}</p>
            <p className="text-sm text-muted-foreground">Low / zero stock</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search product or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kg / powder stock</CardTitle>
        </CardHeader>
        <CardContent>
          <StockTable
            items={kgStock}
            canEdit={canEdit}
            savingId={savingId}
            onSave={saveStock}
            onSelectProduct={(id) => {
              setHistoryProductId(id);
              void loadMovements(id);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Litre / liquid stock</CardTitle>
        </CardHeader>
        <CardContent>
          <StockTable
            items={ltrStock}
            canEdit={canEdit}
            savingId={savingId}
            onSave={saveStock}
            onSelectProduct={(id) => {
              setHistoryProductId(id);
              void loadMovements(id);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Stock movement history</CardTitle>
            <CardDescription>OPENING · INWARD · INVOICE · INVOICE_CANCEL · ADJUSTMENT</CardDescription>
          </div>
          <Select
            value={historyProductId}
            onValueChange={(v) => {
              setHistoryProductId(v);
              void loadMovements(v);
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All products</SelectItem>
              {inventory.map((item) => (
                <SelectItem key={item.id} value={item.productId || item.id}>
                  {item.product?.productCode || "—"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty change</TableHead>
                <TableHead>Ref</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.slice(0, 60).map((m) => (
                <TableRow key={m.id || `${m.sku}-${m.createdAt}`}>
                  <TableCell className="text-sm">
                    {m.createdAt ? new Date(m.createdAt).toLocaleString("en-IN") : "—"}
                  </TableCell>
                  <TableCell>{m.sku || "—"}</TableCell>
                  <TableCell>{m.type}</TableCell>
                  <TableCell className="text-right font-medium">{m.quantity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.invoiceNumber || m.notes || m.referenceId || "—"}
                  </TableCell>
                </TableRow>
              ))}
              {movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No movements yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
