"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Truck, Package, CheckCircle, Loader2, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface QueueItem {
  id: string;
  type: "order" | "invoice";
  referenceNumber: string;
  dealerName?: string;
  dealerCity?: string;
  deliveryAddress?: string;
  totalAmount: number;
  date: string;
  status?: string;
}

interface ActiveDispatch {
  id: string;
  dispatchNumber: string;
  type: "order" | "invoice";
  referenceNumber?: string;
  dealerName?: string;
  dealerCity?: string;
  deliveryAddress?: string;
  totalAmount?: number;
  logisticsPartner: string;
  vehicleNumber: string;
  status: string;
  dispatchDate: string;
}

interface DeliveredDispatch extends ActiveDispatch {
  actualDeliveryDate?: string;
}

interface LogisticsQueue {
  pendingInvoices: QueueItem[];
  pendingOrders: QueueItem[];
  activeDispatches: ActiveDispatch[];
  delivered: DeliveredDispatch[];
  counts: {
    pendingInvoices: number;
    pendingOrders: number;
    activeDispatches: number;
    delivered: number;
  };
}

export default function LogisticsPage() {
  const [queue, setQueue] = useState<LogisticsQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatchDialog, setDispatchDialog] = useState<{
    open: boolean;
    type: "order" | "invoice";
    id: string;
    referenceNumber: string;
  }>({ open: false, type: "invoice", id: "", referenceNumber: "" });
  const [dispatchForm, setDispatchForm] = useState({
    logisticsPartner: "",
    vehicleNumber: "",
    driverName: "",
    driverContact: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await apiFetch("/api/logistics/queue");
      if (res.ok) {
        setQueue(await res.json());
      } else {
        setQueue(null);
      }
    } catch (error) {
      console.error("Failed to fetch logistics queue:", error);
      setQueue(null);
    } finally {
      setLoading(false);
    }
  };

  const openDispatch = (item: QueueItem) => {
    setDispatchError(null);
    setDispatchDialog({
      open: true,
      type: item.type,
      id: item.id,
      referenceNumber: item.referenceNumber,
    });
  };

  const handleCreateDispatch = async () => {
    if (!dispatchForm.logisticsPartner.trim()) {
      setDispatchError("Enter the logistics partner name.");
      return;
    }
    if (!dispatchForm.vehicleNumber.trim()) {
      setDispatchError("Enter the vehicle number.");
      return;
    }
    setDispatchError(null);
    setActionLoading(true);
    try {
      const body =
        dispatchDialog.type === "invoice"
          ? { invoiceId: dispatchDialog.id, ...dispatchForm }
          : { orderId: dispatchDialog.id, ...dispatchForm };

      const res = await apiFetch("/api/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDispatchDialog({ open: false, type: "invoice", id: "", referenceNumber: "" });
        setDispatchForm({
          logisticsPartner: "",
          vehicleNumber: "",
          driverName: "",
          driverContact: "",
        });
        fetchQueue();
      } else {
        const bodyErr = await res.json().catch(() => ({}));
        setDispatchError(typeof bodyErr.error === "string" ? bodyErr.error : "Could not create dispatch.");
      }
    } catch (error) {
      console.error("Failed to create dispatch:", error);
      setDispatchError("Network error. Try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (dispatchId: string, status: string) => {
    try {
      await apiFetch(`/api/dispatches/${dispatchId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchQueue();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const pendingInvoices = queue?.pendingInvoices ?? [];
  const pendingOrders = queue?.pendingOrders ?? [];
  const activeDispatches = queue?.activeDispatches ?? [];
  const delivered = queue?.delivered ?? [];
  const pendingTotal = pendingInvoices.length + pendingOrders.length;
  const inTransitItems = activeDispatches.filter((d) =>
    ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DISPATCHED"].includes(d.status)
  );
  const packingItems = activeDispatches.filter((d) =>
    ["PENDING", "PACKED"].includes(d.status)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Logistics & Dispatch</h1>
        <p className="text-muted-foreground">
          Dispatch invoiced goods and track deliveries through to completion
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTotal}</p>
                <p className="text-sm text-muted-foreground">Pending Dispatch</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
                <FileText className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingInvoices.length}</p>
                <p className="text-sm text-muted-foreground">Invoiced — Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={inTransitItems.length > 0 ? "border-blue-300 bg-blue-50/40" : undefined}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inTransitItems.length}</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
                {packingItems.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    + {packingItems.length} packing / pending
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{delivered.length}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices Ready for Dispatch</CardTitle>
          <CardDescription>
            Generated invoices appear here for logistics to dispatch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pendingInvoices.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No invoices pending dispatch</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvoices.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.referenceNumber}</TableCell>
                    <TableCell>{item.dealerName}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {item.deliveryAddress}
                        {item.dealerCity ? `, ${item.dealerCity}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalAmount)}</TableCell>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openDispatch(item)}>
                        <Truck className="mr-2 h-4 w-4" />
                        Create Dispatch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved Orders — Pending Dispatch</CardTitle>
          <CardDescription>Orders approved by admin awaiting dispatch</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No orders pending dispatch</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOrders.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.referenceNumber}</TableCell>
                    <TableCell>{item.dealerName}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {item.deliveryAddress}
                        {item.dealerCity ? `, ${item.dealerCity}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalAmount)}</TableCell>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openDispatch(item)}>
                        <Truck className="mr-2 h-4 w-4" />
                        Create Dispatch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {inTransitItems.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Truck className="h-5 w-5" />
              Currently In Transit ({inTransitItems.length})
            </CardTitle>
            <CardDescription>
              Dispatched / in-transit / out-for-delivery consignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatch #</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Partner / Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inTransitItems.map((d) => (
                  <TableRow key={`transit-${d.id}`} className="bg-blue-50/50">
                    <TableCell className="font-medium">{d.dispatchNumber}</TableCell>
                    <TableCell>{d.referenceNumber}</TableCell>
                    <TableCell>{d.dealerName}</TableCell>
                    <TableCell>
                      {d.logisticsPartner}
                      <span className="block text-xs text-muted-foreground">{d.vehicleNumber}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Select value={d.status} onValueChange={(status) => handleUpdateStatus(d.id, status)}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PACKED">Packed</SelectItem>
                          <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                          <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                          <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Dispatches</CardTitle>
          <CardDescription>Track ongoing deliveries — set status to Delivered when complete</CardDescription>
        </CardHeader>
        <CardContent>
          {activeDispatches.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No active dispatches</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatch #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Partner / Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDispatches.map((d) => (
                  <TableRow
                    key={d.id}
                    className={
                      ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DISPATCHED"].includes(d.status)
                        ? "bg-blue-50/40"
                        : undefined
                    }
                  >
                    <TableCell className="font-medium">{d.dispatchNumber}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{d.type === "invoice" ? "Invoice" : "Order"}</Badge>
                    </TableCell>
                    <TableCell>{d.referenceNumber}</TableCell>
                    <TableCell>{d.dealerName}</TableCell>
                    <TableCell>
                      {d.logisticsPartner}
                      <span className="block text-xs text-muted-foreground">{d.vehicleNumber}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Select value={d.status} onValueChange={(status) => handleUpdateStatus(d.id, status)}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PACKED">Packed</SelectItem>
                          <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                          <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                          <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivered</CardTitle>
          <CardDescription>Completed dispatches</CardDescription>
        </CardHeader>
        <CardContent>
          {delivered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No delivered dispatches yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatch #</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Delivered On</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delivered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.dispatchNumber}</TableCell>
                    <TableCell>{d.referenceNumber}</TableCell>
                    <TableCell>{d.dealerName}</TableCell>
                    <TableCell>{d.logisticsPartner}</TableCell>
                    <TableCell>
                      {d.actualDeliveryDate ? formatDate(d.actualDeliveryDate) : formatDate(d.dispatchDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status="DELIVERED" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dispatchDialog.open}
        onOpenChange={(open) => {
          if (!open) setDispatchError(null);
          setDispatchDialog({ ...dispatchDialog, open });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create dispatch</DialogTitle>
            <DialogDescription>
              {dispatchDialog.type === "invoice" ? "Invoice" : "Order"}: {dispatchDialog.referenceNumber}
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
                  onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Driver contact</Label>
                <Input
                  value={dispatchForm.driverContact}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, driverContact: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchDialog({ ...dispatchDialog, open: false })}>
              Cancel
            </Button>
            <Button onClick={handleCreateDispatch} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
