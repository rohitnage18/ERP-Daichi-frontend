"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArrowLeft, Truck, FileText, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderDetail {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  deliveryAddress: string;
  specialInstructions: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  dealerName?: string;
  dealerCode?: string;
  dealerCity?: string;
  dealer?: {
    firmName: string;
    dealerCode: string | null;
    city: string;
  };
  invoice?: { id: string; invoiceNumber: string } | null;
  invoiceId?: string;
  invoiceNumber?: string;
  items: {
    id?: string;
    productId?: string;
    productName?: string;
    productCode?: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    totalAmount: number;
    gstRate?: number;
    unitOfMeasure?: string;
    product?: {
      productCode: string;
      name: string;
      unitOfMeasure: string;
    };
  }[];
  createdByName?: string;
  createdBy?: { fullName: string };
  approvedByName?: string;
  approvedBy?: { fullName: string } | null;
  dispatch?: {
    dispatchNumber: string;
    status: string;
    logisticsPartner: string;
  } | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchForm, setDispatchForm] = useState({
    logisticsPartner: "",
    vehicleNumber: "",
    driverName: "",
    driverContact: "",
  });

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  useEffect(() => {
    if (
      searchParams.get("dispatch") === "true" &&
      order?.status === "APPROVED" &&
      !order.dispatch
    ) {
      setDispatchOpen(true);
    }
  }, [searchParams, order]);

  const fetchOrder = async () => {
    try {
      const res = await apiFetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispatch = async () => {
    if (!order?.id) return;
    if (!dispatchForm.logisticsPartner.trim()) {
      setDispatchError("Enter the logistics partner name.");
      return;
    }
    if (!dispatchForm.vehicleNumber.trim()) {
      setDispatchError("Enter the vehicle number.");
      return;
    }
    setDispatchError(null);
    setDispatchLoading(true);
    try {
      const res = await apiFetch("/api/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          ...dispatchForm,
        }),
      });
      if (res.ok) {
        setDispatchOpen(false);
        setDispatchForm({
          logisticsPartner: "",
          vehicleNumber: "",
          driverName: "",
          driverContact: "",
        });
        await fetchOrder();
      } else {
        const body = await res.json().catch(() => ({}));
        setDispatchError(typeof body.error === "string" ? body.error : "Could not create dispatch.");
      }
    } catch (error) {
      console.error("Failed to create dispatch:", error);
      setDispatchError("Network error. Try again.");
    } finally {
      setDispatchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Link href="/dashboard/orders">
          <Button className="mt-4">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-muted-foreground">
              {order.dealerName || order.dealer?.firmName || ''} • {formatDate(order.orderDate)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.status === "APPROVED" && !order.dispatch && (
            <Button onClick={() => setDispatchOpen(true)}>
              <Truck className="mr-2 h-4 w-4" />
              Create Dispatch
            </Button>
          )}
          {order.status === "DELIVERED" && (order.invoice || order.invoiceId) && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/finance/invoices/${order.invoice?.id || order.invoiceId}`}>
                <FileText className="mr-2 h-4 w-4" />
                View Invoice
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Dialog
        open={dispatchOpen}
        onOpenChange={(open) => {
          if (!open) setDispatchError(null);
          setDispatchOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create dispatch</DialogTitle>
            <DialogDescription>
              Enter logistics and vehicle details for {order.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dispatchError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {dispatchError}
              </p>
            )}
            <div className="space-y-2">
              <Label>Logistics partner *</Label>
              <Input
                value={dispatchForm.logisticsPartner}
                onChange={(e) => {
                  setDispatchError(null);
                  setDispatchForm({ ...dispatchForm, logisticsPartner: e.target.value });
                }}
                placeholder="Enter logistics partner name"
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle number *</Label>
              <Input
                value={dispatchForm.vehicleNumber}
                onChange={(e) => {
                  setDispatchError(null);
                  setDispatchForm({ ...dispatchForm, vehicleNumber: e.target.value });
                }}
                placeholder="MH12AB1234"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Driver name</Label>
                <Input
                  value={dispatchForm.driverName}
                  onChange={(e) => {
                    setDispatchError(null);
                    setDispatchForm({ ...dispatchForm, driverName: e.target.value });
                  }}
                  placeholder="Driver name"
                />
              </div>
              <div className="space-y-2">
                <Label>Driver contact</Label>
                <Input
                  value={dispatchForm.driverContact}
                  onChange={(e) => {
                    setDispatchError(null);
                    setDispatchForm({ ...dispatchForm, driverContact: e.target.value });
                  }}
                  placeholder="9876543210"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDispatch} disabled={dispatchLoading}>
              {dispatchLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, idx) => (
                    <TableRow key={item.id || item.productId || idx}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName || item.product?.name || ''}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.productCode || item.product?.productCode || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unitOfMeasure || item.product?.unitOfMeasure || ''}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (GST)</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.specialInstructions && (
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{order.specialInstructions}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dealer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Dealer</p>
                <p className="font-medium">{order.dealerName || order.dealer?.firmName || ''}</p>
                <p className="text-sm text-muted-foreground">{order.dealerCode || order.dealer?.dealerCode || ''}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Address</p>
                <p className="font-medium">{order.deliveryAddress}</p>
              </div>
            </CardContent>
          </Card>

          {order.dispatch && (
            <Card>
              <CardHeader>
                <CardTitle>Dispatch Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Dispatch Number</p>
                  <p className="font-medium">{order.dispatch.dispatchNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Logistics Partner</p>
                  <p className="font-medium">{order.dispatch.logisticsPartner}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={order.dispatch.status} />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium">{order.createdBy?.fullName || order.createdByName || '-'}</p>
              </div>
              {order.approvedBy && (
                <div>
                  <p className="text-sm text-muted-foreground">Approved By</p>
                  <p className="font-medium">{order.approvedBy.fullName}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
