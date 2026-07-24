"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, apiFetchJsonArray, getApiError } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, Loader2, Plus, Trash2, Send, Save, Check, ChevronsUpDown, Search } from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";

interface Dealer {
  id: string;
  dealerCode?: string;
  externalId?: string;
  firmName: string;
  businessAddress?: string;
  firmAddress?: string;
  creditPeriod?: string;
}

interface Product {
  id: string;
  productCode: string;
  name: string;
  basePrice: number;
  gstRate: number;
  unitOfMeasure: string;
  packingSize?: string;
  alternateUnit?: string;
  unitsPerAlternate?: number;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  taxAmount: number;
  totalAmount: number;
  packingSize?: string;
  alternateUnit?: string;
  unitsPerAlternate?: number;
}

function caseLabel(item: OrderItem): string | null {
  if (!item.unitsPerAlternate || item.unitsPerAlternate <= 0) return null;
  const cases = item.quantity / item.unitsPerAlternate;
  if (!Number.isInteger(cases) || cases <= 0) return null;
  return `${cases} ${item.alternateUnit || "Case"}`;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  
  const [dealerOpen, setDealerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [dealerSearch, setDealerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [dealerData, productData] = await Promise.all([
        apiFetchJsonArray<Dealer & { _id?: string }>("/api/daichi-dealers"),
        apiFetchJsonArray<Product>("/api/products"),
      ]);
      if (cancelled) return;
      setDealers(
        dealerData.map((d) => ({
          id: d.id || d._id || "",
          dealerCode: d.dealerCode || d.externalId || "",
          firmName: d.firmName || "",
          businessAddress: d.businessAddress || d.firmAddress || "",
          creditPeriod: d.creditPeriod || "DAYS_60",
        }))
      );
      setProducts(productData);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDealerChange = (dealerId: string) => {
    const dealer = dealers.find((d) => d.id === dealerId);
    setSelectedDealer(dealer || null);
  };

  const addItem = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      updateItemQuantity(productId, existing.quantity + 1);
      return;
    }

    const taxAmount = (product.basePrice * product.gstRate) / 100;
    const totalAmount = product.basePrice + taxAmount;

    setItems([
      ...items,
      {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.basePrice,
        gstRate: product.gstRate,
        taxAmount,
        totalAmount,
        packingSize: product.packingSize,
        alternateUnit: product.alternateUnit,
        unitsPerAlternate: product.unitsPerAlternate,
      },
    ]);
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(
      items.map((item) => {
        if (item.productId === productId) {
          const taxAmount = (item.unitPrice * item.gstRate * quantity) / 100;
          const totalAmount = item.unitPrice * quantity + taxAmount;
          return { ...item, quantity, taxAmount, totalAmount };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  };

  const handleSubmit = async (action: "draft" | "submit") => {
    if (!selectedDealer) {
      alert("Please select a dealer");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one product");
      return;
    }

    setLoading(true);
    const totals = calculateTotals();

    try {
      const res = await apiFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: selectedDealer.id,
          deliveryAddress: selectedDealer.businessAddress || selectedDealer.firmAddress || "",
          specialInstructions,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            gstRate: item.gstRate,
            taxAmount: item.taxAmount,
            totalAmount: item.totalAmount,
          })),
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          status: action === "submit" ? "PENDING_APPROVAL" : "DRAFT",
        }),
      });

      if (res.ok) {
        router.push("/dashboard/orders");
      } else {
        alert(await getApiError(res, "Failed to create order"));
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  const filteredDealers = useMemo(() => {
    if (!dealerSearch) return dealers;
    const search = dealerSearch.toLowerCase();
    return dealers.filter(
      (d) =>
        d.firmName?.toLowerCase().includes(search) ||
        d.dealerCode?.toLowerCase().includes(search) ||
        d.businessAddress?.toLowerCase().includes(search)
    );
  }, [dealers, dealerSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const search = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.productCode.toLowerCase().includes(search)
    );
  }, [products, productSearch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Order</h1>
          <p className="text-muted-foreground">Create a new order for a dealer</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Dealer</CardTitle>
              <CardDescription>Choose an approved dealer for this order</CardDescription>
            </CardHeader>
            <CardContent>
              <Popover open={dealerOpen} onOpenChange={setDealerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={dealerOpen}
                    className="w-full justify-between h-auto min-h-10"
                  >
                    {selectedDealer ? (
                      <div className="flex flex-col items-start text-left">
                        <span className="font-medium">{selectedDealer.firmName}</span>
                        <span className="text-xs text-muted-foreground">{selectedDealer.dealerCode}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground flex items-center">
                        <Search className="mr-2 h-4 w-4" />
                        Search and select a dealer...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search by name or code..." 
                      value={dealerSearch}
                      onValueChange={setDealerSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No dealer found.</CommandEmpty>
                      <CommandGroup>
                        {filteredDealers.map((dealer) => (
                          <CommandItem
                            key={dealer.id}
                            value={dealer.id}
                            onSelect={(value) => {
                              handleDealerChange(value);
                              setDealerOpen(false);
                              setDealerSearch("");
                            }}
                            className="flex items-center justify-between py-3"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{dealer.firmName}</span>
                              <span className="text-xs text-muted-foreground">
                                {dealer.dealerCode} | {dealer.businessAddress || ''}
                              </span>
                            </div>
                            <Check
                              className={cn(
                                "ml-2 h-4 w-4",
                                selectedDealer?.id === dealer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedDealer && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <p className="font-medium">{selectedDealer.firmName}</p>
                  <p className="text-sm text-muted-foreground">{selectedDealer.businessAddress}</p>
                  <p className="text-sm mt-2">
                    Credit Period: <strong>{selectedDealer.creditPeriod === "DAYS_45" ? "45 Days" : "60 Days"}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Products</CardTitle>
              <CardDescription>Select products to add to this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Popover open={productOpen} onOpenChange={setProductOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productOpen}
                      className="flex-1 justify-between h-auto min-h-10"
                    >
                      <span className="text-muted-foreground flex items-center">
                        <Search className="mr-2 h-4 w-4" />
                        Search and select a product to add...
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Search by name or code..." 
                        value={productSearch}
                        onValueChange={setProductSearch}
                      />
                      <CommandList className="max-h-[350px]">
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup>
                          {filteredProducts.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.id}
                              onSelect={(value) => {
                                addItem(value);
                                setProductOpen(false);
                                setProductSearch("");
                              }}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{product.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {product.productCode} | {formatCurrency(product.basePrice)} / {product.unitOfMeasure} | GST: {product.gstRate}%
                                </span>
                              </div>
                              <Plus className="ml-2 h-4 w-4 text-green-600" />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Packing</TableHead>
                      <TableHead className="w-[110px]">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-sm">
                          {item.packingSize || "—"}
                          {item.unitsPerAlternate ? (
                            <span className="block text-xs text-muted-foreground">
                              1 {item.alternateUnit || "Case"} = {item.unitsPerAlternate}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(item.productId, parseInt(e.target.value) || 0)
                            }
                            className="w-20"
                          />
                          {caseLabel(item) && (
                            <span className="mt-1 block text-xs text-brand-700">
                              = {caseLabel(item)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.taxAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No products added yet. Select a product from the dropdown above.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="instructions">Special Instructions</Label>
                <Textarea
                  id="instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special delivery or packing instructions..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (GST)</span>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(totals.totalAmount)}</span>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  onClick={() => handleSubmit("submit")}
                  disabled={loading || !selectedDealer || items.length === 0}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Submit for Approval
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSubmit("draft")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
