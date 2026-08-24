"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, Warehouse, AlertTriangle } from "lucide-react";

interface InventoryItem {
  id: string;
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

function StockTable({ items }: { items: InventoryItem[] }) {
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
          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.product.productCode}</TableCell>
              <TableCell>{item.product.name}</TableCell>
              <TableCell className="text-sm">{item.product.packingSize || "—"}</TableCell>
              <TableCell>{item.product.subCategory.name}</TableCell>
              <TableCell>{item.warehouseCode}</TableCell>
              <TableCell className="text-right">
                {item.quantity.toLocaleString()} {item.product.unitOfMeasure}
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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInventory();
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

  const kgStock = filteredInventory.filter((item) => !isLiquidProduct(item));
  const ltrStock = filteredInventory.filter((item) => isLiquidProduct(item));
  const lowStockCount = inventory.filter((item) => item.quantity <= item.reorderLevel).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Monitor stock levels by packing — Kg and Litre separately</p>
      </div>

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
              <StockTable items={kgStock} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ltr stock</CardTitle>
              <CardDescription>Liquid products (Litre / ml packing)</CardDescription>
            </CardHeader>
            <CardContent>
              <StockTable items={ltrStock} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
