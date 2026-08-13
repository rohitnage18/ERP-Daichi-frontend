"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, RefreshCw, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { matchesProductSearch } from "@/lib/product-search";
import { formatCurrency } from "@/lib/utils";
import { canCreateProduct } from "@/lib/permissions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Product {
  id: string;
  productCode: string;
  name: string;
  basePrice: number;
  mrp?: number | null;
  packingSize?: string | null;
  lotSize?: string | null;
  hsnCode?: string | null;
  gstRate: number;
  unitOfMeasure: string;
  status: string;
  categoryName?: string;
  stockRemaining?: number;
  reorderLevel?: number;
  lowStock?: boolean;
  subCategoryName?: string;
  subCategory?: {
    name?: string;
    category?: {
      name?: string;
    };
  };
}

interface GroupedProducts {
  [category: string]: Product[];
}

export default function ProductsPage() {
  const { data: session } = useSession();
  const showAddProduct = canCreateProduct(session?.user?.role);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const fetchProducts = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const res = await apiFetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (products.length > 0) {
      const categories = new Set(products.map(p => p.categoryName || "Uncategorized"));
      setExpandedCategories(categories);
    }
  }, [products]);

  const handleRefresh = () => {
    fetchProducts(true);
  };

  const filteredProducts = useMemo(
    () => products.filter((product) => matchesProductSearch(product, search)),
    [products, search]
  );

  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc: GroupedProducts, product) => {
      const category = product.categoryName || product.subCategory?.category?.name || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});
  }, [filteredProducts]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const categoryOrder = [
    "Speciality Water Soluble Fertilizer Grades",
    "Generic/Secondary Water Soluble Fertilizer Grades",
    "Secondary Nutrients",
    "Micro Nutrients",
    "Water Soluble Liquid Fertilizer Grades",
    "Primary Nutrients (N:P:K)",
    "Micronutrients",
    "Liquid water-soluble fertilizer (WSF)",
    "Secondary liquid water-soluble fertilizer",
    "Liquid micronutrients",
    "Bio Fertilizers",
    "Bio pesticides",
    "Organic fertilizers",
    "Bio Stimulants",
    "A - Insecticides",
    "B - Weedicides / herbicides",
    "C - Fungicides",
    "D - Plant Growth Promoter / Retardant (PGR)",
    "Uncategorized",
  ];

  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            {products.length} products in {Object.keys(groupedProducts).length} categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          {showAddProduct && (
            <Button asChild>
              <Link href="/dashboard/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, NPK, code, or packing..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              title="No products found"
              action={
                showAddProduct ? (
                  <Button asChild>
                    <Link href="/dashboard/products/new">Add Your First Product</Link>
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((category) => (
            <Card key={category}>
              <Collapsible
                open={expandedCategories.has(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        {category}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({groupedProducts[category].length} products)
                        </span>
                      </CardTitle>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-[100px]">HSN</TableHead>
                          <TableHead className="w-[100px]">Packing</TableHead>
                          <TableHead className="w-[80px]">Lot Size</TableHead>
                          <TableHead className="w-[60px]">Unit</TableHead>
                          <TableHead className="text-right w-[90px]">Stock</TableHead>
                          <TableHead className="text-right w-[100px]">Rate/Unit</TableHead>
                          <TableHead className="text-right w-[100px]">MRP</TableHead>
                          <TableHead className="text-right w-[60px]">GST</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedProducts[category].map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium font-mono text-xs">
                              {product.productCode}
                            </TableCell>
                            <TableCell className="font-medium">
                              <Link
                                href={`/dashboard/products/${product.id}`}
                                className="text-brand-700 hover:underline"
                              >
                                {product.name}
                              </Link>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{product.hsnCode || "—"}</TableCell>
                            <TableCell className="text-sm">{product.packingSize ?? "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{product.lotSize ?? "—"}</TableCell>
                            <TableCell className="text-sm">{product.unitOfMeasure}</TableCell>
                            <TableCell
                              className={`text-right tabular-nums font-medium ${
                                product.lowStock ? "text-amber-700" : ""
                              }`}
                            >
                              {product.stockRemaining ?? 0}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(product.basePrice)}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.mrp != null ? formatCurrency(product.mrp) : "—"}
                            </TableCell>
                            <TableCell className="text-right">{product.gstRate}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
