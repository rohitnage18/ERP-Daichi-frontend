"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

const roleLabels: Record<string, { label: string; color: string }> = {
  SALES_MARKETING: { label: "Sales & Marketing", color: "bg-blue-100 text-blue-800" },
  MANAGEMENT_ADMIN: { label: "Management / Admin", color: "bg-purple-100 text-purple-800" },
  PRODUCTION_LOGISTICS: { label: "Production & Logistics", color: "bg-green-100 text-green-800" },
};

interface UserRow {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  zone?: { name: string } | null;
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Team members from database</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/settings/email">
            <Plus className="mr-2 h-4 w-4" />
            Invite new user
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const roleInfo = roleLabels[user.role] || {
                    label: user.role,
                    color: "bg-gray-100 text-gray-800",
                  };
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.employeeId}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                      </TableCell>
                      <TableCell>{user.zone?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
