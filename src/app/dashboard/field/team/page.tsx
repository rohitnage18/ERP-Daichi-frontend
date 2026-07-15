"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
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
import { ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function TeamFieldPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [userId, setUserId] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/users")
      .then((r) => r.json())
      .then((u) => setUsers(Array.isArray(u) ? u.filter((x: any) => x.role === "SALES_MARKETING") : []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (userId !== "all") params.set("userId", userId);
    params.set("from", `${date}T00:00:00.000Z`);
    params.set("to", `${date}T23:59:59.999Z`);
    const q = params.toString() ? `?${params.toString()}` : "";
    Promise.all([
      apiFetch(`/api/daily-logs${userId !== "all" ? `?userId=${userId}` : ""}`).then((r) => r.json()),
      apiFetch(`/api/visits${q}`).then((r) => r.json()),
      apiFetch(`/api/allowances?status=PENDING`).then((r) => r.json()),
    ])
      .then(([l, v, a]) => {
        setLogs(Array.isArray(l) ? l : []);
        setVisits(Array.isArray(v) ? v : []);
        setAllowances(Array.isArray(a) ? a : []);
      })
      .finally(() => setLoading(false));
  }, [date, userId]);

  const approveAllowance = async (id: string, status: string) => {
    await apiFetch("/api/allowances", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const res = await apiFetch("/api/allowances?status=PENDING");
    setAllowances(await res.json());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Team field activity</h1>
          <p className="text-muted-foreground">Daily logs, visits, and allowance approvals</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <div className="space-y-2">
          <Label>Sales person</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All team</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily logs ({logs.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{log.user?.fullName}</p>
                  <p className="text-muted-foreground">{formatDate(log.logDate)}</p>
                  <p className="mt-1">{log.summary}</p>
                </div>
              ))}
              {logs.length === 0 && <p className="text-muted-foreground text-sm">No logs</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visits ({visits.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {visits.map((v) => (
                <div key={v.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{v.user?.fullName}</p>
                  <p>{v.dealer?.firmName || v.prospectName} — {v.purpose}</p>
                  {v.latitude != null && (
                    <a
                      className="text-xs text-brand-600 underline"
                      href={`https://maps.google.com/?q=${v.latitude},${v.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on map
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Pending allowances ({allowances.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowances.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.user?.fullName}</TableCell>
                      <TableCell>{c.claimType}</TableCell>
                      <TableCell>{formatCurrency(c.amount)}</TableCell>
                      <TableCell className="max-w-xs truncate">{c.description}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="success" onClick={() => approveAllowance(c.id, "APPROVED")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => approveAllowance(c.id, "REJECTED")}>
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
