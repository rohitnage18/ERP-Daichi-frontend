"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { apiFetch } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import {
  billedUnitsFromCases,
  casesFromBilledUnits,
  catalogUnitsPerCase,
  buildLotSize,
  parseUnitsPerCase,
  invoiceUnitOfMeasure,
  DAICHI_SUPPLIER,
} from "@/lib/invoice-utils";
import { matchesProductSearch } from "@/lib/product-search";
import { Plus, Trash2, FileText, Calculator, Check, ChevronsUpDown, Search } from "lucide-react";

interface Dealer {
  id: string;
  externalId?: string;
  firmName: string;
  gstNumber?: string | null;
  gstNo?: string | null;
  panNumber?: string | null;
  aadharNumber?: string | null;
  email?: string | null;
  mobileNumber?: string | null;
  telephoneNumber?: string | null;
  city?: string;
  state?: string;
  district?: string;
  pincode?: string;
  firmAddress?: string;
  businessAddress?: string;
  contactPersonName?: string | null;
  contactPersonAddress?: string | null;
}

interface Product {
  id: string;
  productCode: string;
  name: string;
  basePrice: number;
  mrp?: number;
  gstRate: number;
  hsnCode: string | null;
  unitOfMeasure: string;
  packingSize?: string;
  lotSize?: string;
  unitsPerAlternate?: number;
  alternateUnit?: string;
  categoryName?: string;
  description?: string;
  stockRemaining?: number;
  lowStock?: boolean;
}

interface InvoiceItem {
  productId: string;
  productName: string;
  productCode?: string;
  hsnCode: string;
  packingSize?: string;
  lotSize?: string;
  unitsPerAlternate?: number;
  unitsPerCaseCatalog: number;
  alternateUnit?: string;
  unitOfMeasure?: string;
  mrp?: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingDealer, setLoadingDealer] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedDealer, setSelectedDealer] = useState<string>("");
  const [selectedDealerInfo, setSelectedDealerInfo] = useState<Dealer | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [reverseCharge, setReverseCharge] = useState(false);
  
  const [dealerOpen, setDealerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [dealerSearch, setDealerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  
  const [gstAutoFill, setGstAutoFill] = useState(true);
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPincode, setShippingPincode] = useState("");
  const [shippingGstn, setShippingGstn] = useState("");
  
  const [termsAndConditions, setTermsAndConditions] = useState(
    "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged on overdue payments.\n3. Subject to local jurisdiction."
  );
  const [bankDetails, setBankDetails] = useState(
    `A/c Holder's Name : ${DAICHI_SUPPLIER.name}\nBank Name : ${DAICHI_SUPPLIER.bankName}\nA/c No. : ${DAICHI_SUPPLIER.bankAccountNo}\nBranch & IFS Code : ${DAICHI_SUPPLIER.bankBranch} & ${DAICHI_SUPPLIER.bankIfsc}`
  );

  const [freightCharges, setFreightCharges] = useState(0);

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  useEffect(() => {
    fetchDealers();
    fetchProducts();
    
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 30);
    setDueDate(due.toISOString().split("T")[0]);
  }, []);

  const fetchDealers = async () => {
    try {
      const res = await apiFetch("/api/daichi-dealers");
      if (res.ok) {
        const data = await res.json();
        setDealers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching dealers:", error);
      setDealers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiFetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const handleDealerChange = async (dealerId: string) => {
    setSelectedDealer(dealerId);
    setLoadingDealer(true);
    
    try {
      const res = await apiFetch(`/api/daichi-dealers/${dealerId}`);
      if (res.ok) {
        const dealer = await res.json();
        setSelectedDealerInfo(dealer);
        
        const state = dealer.state || '';
        const city = dealer.city || dealer.district || '';
        const gstn = dealer.gstNumber || dealer.gstNo || '';
        const address = dealer.firmAddress || dealer.businessAddress || dealer.contactPersonAddress || '';
        const pincode = dealer.pincode || '';
        
        setPlaceOfSupply(state || city);
        setShippingName(dealer.firmName || dealer.contactPersonName || '');
        setShippingAddress(address);
        setShippingCity(city);
        setShippingState(state);
        setShippingPincode(pincode);
        setShippingGstn(gstn);
      } else {
        const dealer = dealers.find((d) => d.id === dealerId || d.externalId === dealerId);
        if (dealer) {
          setSelectedDealerInfo(dealer);
          setPlaceOfSupply(dealer.state || dealer.city || '');
          setShippingName(dealer.firmName || '');
          setShippingAddress(dealer.firmAddress || dealer.businessAddress || '');
          setShippingCity(dealer.city || '');
          setShippingState(dealer.state || '');
          setShippingPincode(dealer.pincode || '');
          setShippingGstn(dealer.gstNumber || dealer.gstNo || '');
        }
      }
    } catch (error) {
      console.error("Error fetching dealer details:", error);
      const dealer = dealers.find((d) => d.id === dealerId || d.externalId === dealerId);
      if (dealer) {
        setSelectedDealerInfo(dealer);
        setPlaceOfSupply(dealer.city || '');
        setShippingName(dealer.firmName || '');
        setShippingAddress(dealer.firmAddress || dealer.businessAddress || '');
        setShippingCity(dealer.city || '');
        setShippingGstn(dealer.gstNumber || dealer.gstNo || '');
      }
    } finally {
      setLoadingDealer(false);
    }
  };

  const addItem = () => {
    if (!selectedProduct) return;
    
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const unitsPerCase = catalogUnitsPerCase(product.unitsPerAlternate, product.lotSize);
    const alternateUnit =
      parseUnitsPerCase(product.lotSize) != null
        ? "Case"
        : product.alternateUnit || "Case";
    const unitOfMeasure = invoiceUnitOfMeasure(
      product.unitOfMeasure,
      null,
      product.lotSize
    );
    const fromCatalog = parseUnitsPerCase(product.lotSize);
    const lotSize =
      fromCatalog != null && product.lotSize
        ? product.lotSize
        : buildLotSize(product.packingSize, unitsPerCase, product.lotSize, alternateUnit);
    // Qty field = cases. 1 case of 5Kg×3 bills 3 units; 2 cases bill 6.
    const oneCaseUnits = billedUnitsFromCases(1, unitsPerCase);

    const existing = items.find((i) => i.productId === selectedProduct);
    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === selectedProduct
            ? { ...i, quantity: i.quantity + oneCaseUnits }
            : i
        )
      );
    } else {
      const gstRate = product.gstRate;
      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          productCode: product.productCode,
          hsnCode: product.hsnCode || "",
          packingSize: product.packingSize || product.unitOfMeasure,
          lotSize,
          unitsPerAlternate: unitsPerCase,
          unitsPerCaseCatalog: unitsPerCase,
          alternateUnit,
          unitOfMeasure,
          mrp: product.mrp || product.basePrice,
          quantity: oneCaseUnits,
          unitPrice: product.basePrice,
          discount: 0,
          gstRate,
          cgstRate: gstRate / 2,
          sgstRate: gstRate / 2,
          igstRate: 0,
        },
      ]);
    }
    setSelectedProduct("");
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: number | string) => {
    setItems(
      items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "gstRate") {
          const rate = typeof value === "number" ? value : parseFloat(String(value)) || 0;
          updated.gstRate = rate;
          updated.cgstRate = rate / 2;
          updated.sgstRate = rate / 2;
          updated.igstRate = 0;
        }
        if (field === "quantity") {
          const cases = typeof value === "number" ? value : parseInt(String(value), 10) || 1;
          const upc =
            item.unitsPerCaseCatalog ||
            catalogUnitsPerCase(item.unitsPerAlternate, item.lotSize);
          updated.quantity = billedUnitsFromCases(cases, upc);
        }
        return updated;
      })
    );
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const taxableValue = item.quantity * item.unitPrice - item.discount;
    const cgst = (taxableValue * item.cgstRate) / 100;
    const sgst = (taxableValue * item.sgstRate) / 100;
    const igst = (taxableValue * item.igstRate) / 100;
    return {
      taxableValue,
      cgst,
      sgst,
      igst,
      total: taxableValue + cgst + sgst + igst,
    };
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    items.forEach((item) => {
      const calc = calculateItemTotal(item);
      subtotal += calc.taxableValue;
      totalCgst += calc.cgst;
      totalSgst += calc.sgst;
      totalIgst += calc.igst;
    });

    const totalTax = totalCgst + totalSgst + totalIgst;
    const freight = Math.max(0, freightCharges || 0);
    const rawTotal = subtotal + totalTax - freight;
    const roundedTotal = Math.round(rawTotal);
    const roundOff = Math.round((roundedTotal - rawTotal) * 100) / 100;

    return {
      subtotal,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      totalTax,
      freightCharges: freight,
      roundOff,
      grandTotal: roundedTotal,
    };
  };

  const handleSubmit = async () => {
    if (!selectedDealer || items.length === 0) {
      alert("Please select a dealer and add at least one item");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: selectedDealer,
          invoiceDate,
          dueDate,
          placeOfSupply,
          reverseCharge,
          shippingName,
          shippingAddress,
          shippingCity,
          shippingState,
          shippingPincode,
          shippingGstn,
          termsAndConditions,
          bankDetails,
          freightCharges: freightCharges > 0 ? freightCharges : 0,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            lotSize: item.lotSize,
            unitsPerAlternate: item.unitsPerAlternate,
            cgstRate: item.cgstRate,
            sgstRate: item.sgstRate,
            igstRate: item.igstRate,
          })),
        }),
      });

      if (res.ok) {
        const invoice = await res.json();
        router.push(`/print/invoices/${invoice.id}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Failed to create invoice");
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
        d.city?.toLowerCase().includes(search) ||
        (d.gstNumber || d.gstNo || "").toLowerCase().includes(search)
    );
  }, [dealers, dealerSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter((p) => matchesProductSearch(p, productSearch));
  }, [products, productSearch]);

  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: Product[] } = {};
    filteredProducts.forEach((p) => {
      const cat = p.categoryName || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [filteredProducts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground">Generate GST-compliant invoices for dealers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/billing/export">
              <FileText className="mr-2 h-4 w-4" />
              GSTN Export
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Basic invoice information</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Dealer / Bill To</Label>
                <Popover open={dealerOpen} onOpenChange={setDealerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={dealerOpen}
                      className="w-full justify-between h-auto min-h-10"
                      disabled={loadingDealer}
                    >
                      {selectedDealer ? (
                        <div className="flex flex-col items-start text-left">
                          <span className="font-medium">
                            {dealers.find((d) => d.id === selectedDealer || d.externalId === selectedDealer)?.firmName || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {dealers.find((d) => d.id === selectedDealer || d.externalId === selectedDealer)?.city || ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Search and select a dealer...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Search by name, city, or GSTN..." 
                        value={dealerSearch}
                        onValueChange={setDealerSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No dealer found.</CommandEmpty>
                        <CommandGroup>
                          {filteredDealers.map((dealer) => (
                            <CommandItem
                              key={dealer.id || dealer.externalId}
                              value={dealer.id || dealer.externalId || ''}
                              onSelect={(value) => {
                                handleDealerChange(value);
                                setDealerOpen(false);
                                setDealerSearch("");
                              }}
                              className="flex items-center justify-between py-3"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{dealer.firmName || 'Unknown'}</span>
                                <span className="text-xs text-muted-foreground">
                                  GSTN: {dealer.gstNumber || dealer.gstNo || '-'} | {dealer.city || ''}, {dealer.state || ''}
                                </span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-2 h-4 w-4",
                                  selectedDealer === (dealer.id || dealer.externalId)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              {loadingDealer && (
                <div className="sm:col-span-2 flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading dealer info...</span>
                </div>
              )}
              
              {selectedDealerInfo && !loadingDealer && (
                <div className="sm:col-span-2 rounded-lg border bg-slate-50 p-4">
                  <h4 className="font-semibold text-sm mb-3 text-slate-700">Selected Dealer Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Firm Name:</span>
                      <p className="font-medium">{selectedDealerInfo.firmName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">GSTIN:</span>
                      <p className="font-mono font-medium">{selectedDealerInfo.gstNumber || selectedDealerInfo.gstNo || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">PAN:</span>
                      <p className="font-mono">{selectedDealerInfo.panNumber || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mobile:</span>
                      <p>{selectedDealerInfo.mobileNumber || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p>{selectedDealerInfo.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">City/District:</span>
                      <p>{selectedDealerInfo.city || selectedDealerInfo.district || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">State:</span>
                      <p>{selectedDealerInfo.state || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pincode:</span>
                      <p>{selectedDealerInfo.pincode || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Address:</span>
                      <p>{selectedDealerInfo.firmAddress || selectedDealerInfo.businessAddress || '-'}</p>
                    </div>
                    {selectedDealerInfo.contactPersonName && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Contact Person:</span>
                        <p>{selectedDealerInfo.contactPersonName}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div>
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Place of Supply</Label>
                <Input
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  placeholder="City/State"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reverseCharge"
                  checked={reverseCharge}
                  onChange={(e) => setReverseCharge(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="reverseCharge">Reverse Charge Applicable</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shipping Details (GSTN)</CardTitle>
                  <CardDescription>Shipping address for e-way bill</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="gstAutoFill" className="text-sm text-muted-foreground">GST Auto-fill</Label>
                  <Button
                    id="gstAutoFill"
                    type="button"
                    variant={gstAutoFill ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setGstAutoFill(!gstAutoFill);
                      if (!gstAutoFill && selectedDealerInfo) {
                        setShippingGstn(selectedDealerInfo.gstNumber || selectedDealerInfo.gstNo || '');
                      }
                    }}
                    className="h-8"
                  >
                    {gstAutoFill ? "Auto" : "Manual"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Consignee Name</Label>
                <Input
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>GSTIN</Label>
                  {!gstAutoFill && (
                    <span className="text-xs text-orange-600 font-medium">Manual Entry</span>
                  )}
                </div>
                <Input
                  value={shippingGstn}
                  onChange={(e) => setShippingGstn(e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                  disabled={gstAutoFill}
                  className={gstAutoFill ? "bg-slate-100" : "border-orange-400"}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Input
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                />
              </div>
              <div>
                <Label>PIN Code</Label>
                <Input
                  value={shippingPincode}
                  onChange={(e) => setShippingPincode(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
              <CardDescription>
                Change Qty only. Units per case update automatically and cannot be edited.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <Popover open={productOpen} onOpenChange={setProductOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productOpen}
                      className="flex-1 justify-between h-auto min-h-10"
                    >
                      {selectedProduct ? (
                        <div className="flex flex-col items-start text-left">
                          <span className="font-medium">
                            {products.find((p) => p.id === selectedProduct)?.name || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {products.find((p) => p.id === selectedProduct)?.productCode || ""} | {formatCurrency(products.find((p) => p.id === selectedProduct)?.basePrice || 0)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground flex items-center">
                          <Search className="mr-2 h-4 w-4" />
                          Search products by name, NPK, code, or packing...
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Search name, code, NPK, packing (e.g. 15:30:15 or 5kg)..." 
                        value={productSearch}
                        onValueChange={setProductSearch}
                      />
                      <CommandList className="max-h-[400px]">
                        <CommandEmpty>No product found.</CommandEmpty>
                        {Object.entries(groupedProducts).map(([category, prods]) => (
                          <CommandGroup key={category} heading={category}>
                            {prods.map((product) => (
                              <CommandItem
                                key={product.id}
                                value={product.id}
                                onSelect={(value) => {
                                  setSelectedProduct(value);
                                  setProductOpen(false);
                                  setProductSearch("");
                                }}
                                className="flex items-center justify-between py-2"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{product.name} - {product.packingSize || product.unitOfMeasure}</span>
                                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                                    <span className="font-mono">{product.productCode}</span>
                                    {product.lotSize && (
                                      <span className="text-blue-600">
                                        Lot: {product.lotSize}
                                      </span>
                                    )}
                                    <span>HSN: {product.hsnCode || '-'}</span>
                                    <span className="font-semibold text-green-700">Rate: {formatCurrency(product.basePrice)}</span>
                                    <span>MRP: {formatCurrency(product.mrp || product.basePrice)}</span>
                                    <span className={product.lowStock ? "font-semibold text-amber-700" : ""}>
                                      Stock: {product.stockRemaining ?? 0}
                                    </span>
                                  </div>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4",
                                    selectedProduct === product.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button onClick={addItem} disabled={!selectedProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              {items.length > 0 && (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>HSN</TableHead>
                        <TableHead>Packing</TableHead>
                        <TableHead className="w-20">Qty</TableHead>
                        <TableHead className="w-40">Units per Case</TableHead>
                        <TableHead className="w-28">Rate/Unit</TableHead>
                        <TableHead className="w-24">Discount</TableHead>
                        <TableHead className="w-20">GST %</TableHead>
                        <TableHead className="text-right">Taxable</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => {
                        const calc = calculateItemTotal(item);
                        const upc =
                          item.unitsPerCaseCatalog ||
                          catalogUnitsPerCase(item.unitsPerAlternate, item.lotSize);
                        const caseQty = casesFromBilledUnits(item.quantity, upc);
                        const totalUnits = billedUnitsFromCases(caseQty, upc);
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.productName} {item.packingSize ? `- ${item.packingSize}` : ''}</p>
                                {item.productCode && (
                                  <p className="text-xs text-muted-foreground font-mono">{item.productCode}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{item.hsnCode}</TableCell>
                            <TableCell className="text-sm">{item.packingSize || '-'}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                value={caseQty}
                                onChange={(e) =>
                                  updateItem(index, "quantity", parseInt(e.target.value, 10) || 1)
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex h-10 w-24 items-center rounded-md border bg-muted px-3 text-sm tabular-nums">
                                {totalUnits}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.discount}
                                onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={String(item.gstRate)}
                                onValueChange={(v) => updateItem(index, "gstRate", parseFloat(v))}
                              >
                                <SelectTrigger className="w-20 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5%</SelectItem>
                                  <SelectItem value="12">12%</SelectItem>
                                  <SelectItem value="18">18%</SelectItem>
                                  <SelectItem value="28">28%</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(calc.taxableValue)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs">
                              {formatCurrency(calc.cgst + calc.sgst + calc.igst)}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatCurrency(calc.total)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calculator className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No items added yet. Select a product above to add it to the invoice.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Bank Details</Label>
                <Textarea
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CGST</span>
                  <span className="tabular-nums">{formatCurrency(totals.cgst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SGST</span>
                  <span className="tabular-nums">{formatCurrency(totals.sgst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IGST</span>
                  <span className="tabular-nums">{formatCurrency(totals.igst)}</span>
                </div>
                <div className="flex justify-between text-sm items-center gap-2">
                  <span className="text-muted-foreground">Freight (Less)</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={freightCharges || ""}
                    onChange={(e) => setFreightCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="h-8 w-28 text-right tabular-nums"
                  />
                </div>
                {totals.roundOff !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Round Off</span>
                    <span className="tabular-nums">{totals.roundOff.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Tax</span>
                    <span className="tabular-nums">{formatCurrency(totals.totalTax)}</span>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total</span>
                    <span className="tabular-nums text-brand-700">
                      {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={loading || !selectedDealer || items.length === 0}
                >
                  {loading ? "Creating..." : "Create Invoice"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Invoice will be created in DRAFT status
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
