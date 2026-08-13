"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { GradeBadge } from "@/components/shared/GradeBadge";
import { gradeFromCreditLimit } from "@/lib/dealer-grade";
import { Search, Eye, RefreshCw, Loader2, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { canCreateDealer, canSyncDealers } from "@/lib/permissions";

interface DaichiDealer {
  id: string;
  externalId: string;
  syncStatus: string;
  firmName: string;
  email: string | null;
  mobileNumber: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  sourceUpdatedAt: string | null;
  lastSyncedAt: string;
  partners?: Array<unknown>;
  bankAccounts?: Array<unknown>;
  infrastructures?: Array<unknown>;
  documents?: Array<unknown>;
  creditLimit?: number;
  dealerGrade?: string;
  _count?: {
    partners: number;
    bankAccounts: number;
    infrastructures: number;
    documents: number;
  };
}

export default function DealersPage() {
  const { data: session } = useSession();
  const canSync = canSyncDealers(session?.user?.role);
  const showNewDealer = canCreateDealer(session?.user?.role);

  const [dealers, setDealers] = useState<DaichiDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [syncStatus, setSyncStatus] = useState<{
    totalDealers: number;
    localCount?: number;
    remoteCount?: number | null;
    pendingSync?: number | null;
    syncInProgress: boolean;
    lastSync: { finishedAt: string; created: number; updated: number } | null;
  } | null>(null);

  const triggerAutoSync = useCallback(async () => {
    try {
      await apiFetch("/api/daichi-dealers/sync/auto", { method: "POST" });
    } catch {
      /* debounced or in progress — ignore */
    }
  }, []);

  const refreshDealersList = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const res = await apiFetch("/api/daichi-dealers");
      const data = await res.json();
      setDealers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch dealers:", error);
      setDealers([]);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  }, []);

  const fetchDealers = useCallback(
    async (showRefreshIndicator = false) => {
      await triggerAutoSync();
      await refreshDealersList(showRefreshIndicator);
    },
    [triggerAutoSync, refreshDealersList]
  );

  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/daichi-dealers/sync-status");
      if (res.ok) {
        setSyncStatus(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch sync status:", error);
    }
  }, []);

  useEffect(() => {
    fetchDealers();
    fetchSyncStatus();

    const poll = setInterval(async () => {
      await refreshDealersList(false);
      await fetchSyncStatus();
    }, 60_000);

    const onFocus = () => {
      fetchDealers(false);
      fetchSyncStatus();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchDealers, fetchSyncStatus, triggerAutoSync, refreshDealersList]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (canSync) {
        await apiFetch("/api/daichi-dealers/sync", { method: "POST" }).catch(() => null);
      } else {
        await triggerAutoSync();
      }
      await refreshDealersList(false);
      await fetchSyncStatus();
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const filteredDealers = dealers.filter((dealer) => {
    const matchesSearch =
      dealer.firmName.toLowerCase().includes(search.toLowerCase()) ||
      (dealer.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (dealer.mobileNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      dealer.externalId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || dealer.syncStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dealers</h1>
          <p className="text-muted-foreground">
            {syncStatus?.totalDealers ?? dealers.length} dealers in ERP
            {syncStatus?.remoteCount != null && syncStatus.remoteCount !== syncStatus.totalDealers && (
              <span className="ml-1 text-amber-700">
                ({syncStatus.pendingSync ?? 0} syncing from dealer form…)
              </span>
            )}
            {syncStatus?.lastSync && (
              <span className="ml-2 text-xs">
                (Last sync: {formatDate(syncStatus.lastSync.finishedAt)})
              </span>
            )}
            <span className="ml-2 text-xs text-green-700">• Auto-refresh every 60s</span>
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
          {showNewDealer && (
            <Button asChild>
              <Link href="/dashboard/dealers/new">
                <Plus className="mr-2 h-4 w-4" />
                New Dealer
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by firm, email, mobile, or external ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDealers.length === 0 ? (
            <EmptyState
              title="No dealers yet"
              action={
                showNewDealer ? (
                  <Button asChild>
                    <Link href="/dashboard/dealers/new">Add Your First Dealer</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 text-center">Sr. No.</TableHead>
                  <TableHead>Firm Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tax IDs</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Synced</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDealers.map((dealer, index) => (
                  <TableRow key={dealer.id}>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell>{dealer.firmName}</TableCell>
                    <TableCell>
                      <p className="text-sm">{dealer.mobileNumber || "-"}</p>
                      <p className="text-xs text-muted-foreground">{dealer.email || "-"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs">GST: {dealer.gstNumber || "-"}</p>
                      <p className="text-xs">PAN: {dealer.panNumber || "-"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs">Partners: {dealer.partners?.length ?? dealer._count?.partners ?? 0}</p>
                      <p className="text-xs">Banks: {dealer.bankAccounts?.length ?? dealer._count?.bankAccounts ?? 0}</p>
                      <p className="text-xs">Docs: {dealer.documents?.length ?? dealer._count?.documents ?? 0}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(dealer.sourceUpdatedAt || dealer.lastSyncedAt)}
                    </TableCell>
                    <TableCell>
                      <GradeBadge
                        grade={dealer.dealerGrade || gradeFromCreditLimit(dealer.creditLimit)}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={dealer.syncStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/dealers/${dealer.externalId}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
