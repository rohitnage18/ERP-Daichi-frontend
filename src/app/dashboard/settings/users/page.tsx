"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiFetch, apiFetchJsonArray } from "@/lib/api";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search } from "lucide-react";

const roleLabels: Record<string, { label: string; color: string; access: string }> = {
  SALES_MARKETING: {
    label: "Sales & Marketing",
    color: "bg-blue-100 text-blue-800",
    access: "Field work, dealers, orders, and recommendations. Cannot approve reports, change stock, or open accounts.",
  },
  ACCOUNT: {
    label: "Accounts & Finance",
    color: "bg-amber-100 text-amber-800",
    access: "Invoices, payments, credit and debit notes, and billing. Can view dealers and orders. Cannot change stock or approve field reports.",
  },
  PRODUCTION_LOGISTICS: {
    label: "Production & Logistics",
    color: "bg-green-100 text-green-800",
    access: "Stock, warehouse transfer, dispatch, and invoice view. Cannot edit dealers, take payments, or approve reports.",
  },
  MANAGEMENT_ADMIN: {
    label: "Management / Admin",
    color: "bg-purple-100 text-purple-800",
    access: "Users, approvals, reports, and team tracking. Cannot raise invoices or record payments.",
  },
};

const ROLE_OPTIONS = ["SALES_MARKETING", "ACCOUNT", "PRODUCTION_LOGISTICS", "MANAGEMENT_ADMIN"] as const;

interface UserRow {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  zoneId?: string | null;
  zoneName?: string | null;
  zone?: { name: string } | null;
}

interface ZoneOption {
  id: string;
  name: string;
}

interface UserForm {
  fullName: string;
  email: string;
  phone: string;
  employeeId: string;
  role: string;
  zoneId: string;
  password: string;
  status: string;
}

const emptyForm: UserForm = {
  fullName: "",
  email: "",
  phone: "",
  employeeId: "",
  role: "SALES_MARKETING",
  zoneId: "",
  password: "",
  status: "ACTIVE",
};

export default function UsersPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    apiFetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    apiFetchJsonArray<ZoneOption>("/api/zones")
      .then(setZones)
      .catch(() => setZones([]));
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      includesQuery(user?.fullName, search) ||
      includesQuery(user?.email, search) ||
      includesQuery(user?.employeeId, search) ||
      includesQuery(roleLabels[user?.role]?.label, search)
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setEditing(user);
    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      employeeId: user.employeeId || "",
      role: user.role || "SALES_MARKETING",
      zoneId: user.zoneId || "",
      password: "",
      status: user.status || "ACTIVE",
    });
    setError(null);
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const zone = zones.find((z) => z.id === form.zoneId);
    const body: Record<string, string> = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      employeeId: form.employeeId.trim(),
      role: form.role,
      status: form.status,
      zoneId: form.zoneId,
      zoneName: zone?.name || "",
    };
    if (!editing || form.password) body.password = form.password;

    try {
      let res = await apiFetch(editing ? `/api/users/${editing.id}` : "/api/users", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!editing && res.status === 404) {
        res = await apiFetch("/api/emails/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: body.fullName,
            email: body.email,
            phone: body.phone,
            employeeId: body.employeeId,
            role: body.role,
            zoneId: body.zoneId,
            zoneName: body.zoneName,
            temporaryPassword: body.password,
          }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save this user");
        return;
      }
      const saved = data.user || data;
      setOpen(false);
      setNotice(
        editing
          ? `${saved.fullName} updated. Their next login uses the ${roleLabels[saved.role]?.label || saved.role} role.`
          : `${saved.fullName} can sign in with ${saved.email} and the password you set.`
      );
      loadUsers();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const access = roleLabels[form.role]?.access;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Create a login for Sales, Account, or Logistics. Each role only opens its own screens.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add user
        </Button>
      </div>

      {notice && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm">{notice}</div>
      )}

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, or role..."
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
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No users match this search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
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
                        <TableCell>{user.zone?.name || user.zoneName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Change the role to change what this person can open after they sign in again."
                : "They can sign in immediately with this email and password."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(role) => setForm({ ...form, role })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zone</Label>
                <Select
                  value={form.zoneId || "none"}
                  onValueChange={(zoneId) => setForm({ ...form, zoneId: zoneId === "none" ? "" : zoneId })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No zone</SelectItem>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editing && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(status) => setForm({ ...form, status })}
                    disabled={editing.id === session?.user?.id}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>{editing ? "New password" : "Password"}</Label>
                <Input
                  type="password"
                  required={!editing}
                  minLength={editing && !form.password ? undefined : 8}
                  placeholder={editing ? "Leave blank to keep the current password" : "At least 8 characters"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            {access && <p className="text-sm text-muted-foreground">{access}</p>}
            {error && <p className="text-sm text-red-700">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save" : "Create login"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
