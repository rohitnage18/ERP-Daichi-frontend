"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, apiFetchJsonArray } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface EmailLog {
  id: string;
  toEmail: string;
  subject: string;
  emailType: string;
  status: string;
  error?: string;
  createdAt: string;
}

export default function EmailSettingsPage() {
  const [tab, setTab] = useState<"invite" | "send" | "report" | "logs">("invite");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"ok" | "error">("ok");
  const [canResend, setCanResend] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState<boolean | null>(null);
  const [emailProvider, setEmailProvider] = useState<string | null>(null);
  const [emailFrom, setEmailFrom] = useState<string | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  const [invite, setInvite] = useState({
    fullName: "",
    email: "",
    phone: "",
    employeeId: "",
    role: "SALES_MARKETING",
    zoneId: "",
  });

  const [email, setEmail] = useState({ to: "", cc: "", subject: "", body: "" });
  const [reportEmails, setReportEmails] = useState("");
  const [zones, setZones] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    apiFetchJsonArray<{ id: string; name: string }>("/api/zones")
      .then(setZones)
      .catch(() => setZones([]));

    apiFetch("/api/emails/status")
      .then((r) => r.json())
      .then((d) => {
        setSmtpConfigured(Boolean(d.smtpConfigured || d.emailConfigured));
        setEmailProvider(d.provider || null);
        setEmailFrom(d.from || null);
      })
      .catch(() => setSmtpConfigured(false));

    apiFetchJsonArray<EmailLog>("/api/emails/logs")
      .then(setEmailLogs)
      .catch(() => setEmailLogs([]));
  }, []);

  const showMsg = (text: string, kind: "ok" | "error" = "ok") => {
    setMessage(text);
    setMessageKind(kind);
    setTimeout(() => setMessage(null), 8000);
  };

  const submitInvite = async (e: React.FormEvent, resend = false) => {
    e.preventDefault();
    setLoading(true);
    setCanResend(false);
    try {
      const res = await apiFetch("/api/emails/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invite,
          email: invite.email.trim().toLowerCase(),
          employeeId: invite.employeeId.trim(),
          resend,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const tempHint = data.temporaryPassword
          ? ` Temporary password: ${data.temporaryPassword} (email not sent — share this manually).`
          : "";
        showMsg(
          data.resent
            ? `Login details resent to ${data.user?.email || invite.email}.${tempHint}`
            : data.emailResult?.simulated
              ? `User created. Temporary password: ${data.temporaryPassword} (SMTP not configured — share manually)`
              : "Invitation email sent successfully."
        );
        if (!data.resent) {
          setInvite({ fullName: "", email: "", phone: "", employeeId: "", role: "SALES_MARKETING", zoneId: "" });
        }
        setCanResend(false);
      } else if (res.status === 409 && data.code === "EMAIL_EXISTS") {
        setCanResend(true);
        showMsg(data.error || "This email is already registered.", "error");
      } else {
        showMsg(data.error || "Could not send invite.", "error");
      }
    } catch {
      showMsg("Network error. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg(data.message || (data.simulated ? "Saved to log (configure SMTP to send real email)" : "Email sent."));
        setEmail({ to: "", cc: "", subject: "", body: "" });
        apiFetchJsonArray<EmailLog>("/api/emails/logs").then(setEmailLogs).catch(() => {});
      } else showMsg(data.error || "Failed");
    } catch {
      showMsg("Network error");
    } finally {
      setLoading(false);
    }
  };

  const sendMonthlyReport = async () => {
    setLoading(true);
    try {
      if (reportEmails.trim()) {
        await apiFetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ management_report_emails: reportEmails }),
        });
      }
      const res = await apiFetch("/api/reports/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: reportEmails
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) showMsg(`Report sent to ${data.sent?.length || 0} recipient(s).`);
      else showMsg(data.error || "Failed");
    } catch {
      showMsg("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
          <h1 className="text-3xl font-bold">Email & invitations</h1>
          <p className="text-muted-foreground">Invite staff and send management reports</p>
        </div>

      {message && (
        <div
          className={
            messageKind === "error"
              ? "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              : "rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm"
          }
        >
          <p>{message}</p>
          {canResend && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={loading}
              onClick={(e) => void submitInvite(e, true)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend login details
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={smtpConfigured ? "default" : "secondary"}>
          Email:{" "}
          {smtpConfigured === null
            ? "Checking…"
            : smtpConfigured
              ? `Configured (${emailProvider || "smtp"}${emailFrom ? ` · ${emailFrom}` : ""})`
              : "Not configured — emails saved to log only"}
        </Badge>
        {!smtpConfigured && smtpConfigured !== null && (
          <span className="text-xs text-muted-foreground">
            Set RESEND_API_KEY + RESEND_FROM (cloud) or SMTP_HOST/USER/PASS (EC2/local) in backend .env
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={tab === "invite" ? "default" : "outline"} onClick={() => setTab("invite")}>
          <UserPlus className="mr-2 h-4 w-4" /> Invite user
        </Button>
        <Button variant={tab === "send" ? "default" : "outline"} onClick={() => setTab("send")}>
          <Mail className="mr-2 h-4 w-4" /> Send email
        </Button>
        <Button variant={tab === "report" ? "default" : "outline"} onClick={() => setTab("report")}>
          Monthly report
        </Button>
        <Button variant={tab === "logs" ? "default" : "outline"} onClick={() => setTab("logs")}>
          Email log
        </Button>
      </div>

      {tab === "invite" && (
        <Card>
          <CardHeader>
            <CardTitle>Add new team member</CardTitle>
            <CardDescription>Creates account and emails login details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void submitInvite(e, false)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full name *</Label>
                  <Input required value={invite.fullName} onChange={(e) => setInvite({ ...invite, fullName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID *</Label>
                  <Input required value={invite.employeeId} onChange={(e) => setInvite({ ...invite, employeeId: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" required value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input required value={invite.phone} onChange={(e) => setInvite({ ...invite, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={invite.role} onValueChange={(v) => setInvite({ ...invite, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALES_MARKETING">Sales & Marketing</SelectItem>
                      <SelectItem value="PRODUCTION_LOGISTICS">Production & Logistics</SelectItem>
                      <SelectItem value="ACCOUNT">Accounts & Finance</SelectItem>
                      <SelectItem value="MANAGEMENT_ADMIN">Management Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create & send invite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "send" && (
        <Card>
          <CardHeader>
            <CardTitle>Send email</CardTitle>
            <CardDescription>Send any email to dealers, staff, or partners</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitEmail} className="space-y-4">
              <div className="space-y-2">
                <Label>To *</Label>
                <Input type="email" required value={email.to} onChange={(e) => setEmail({ ...email, to: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CC</Label>
                <Input value={email.cc} onChange={(e) => setEmail({ ...email, cc: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input required value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea rows={6} required value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })} />
              </div>
              <Button type="submit" disabled={loading}>Send</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "report" && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly management report</CardTitle>
            <CardDescription>
              Sends sales, collections, and operations summary to management. Schedule via cron:
              GET /api/cron/monthly-report with Bearer CRON_SECRET
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Management emails (comma-separated)</Label>
              <Input
                placeholder="admin@daichi.com, director@daichi.com"
                value={reportEmails}
                onChange={(e) => setReportEmails(e.target.value)}
              />
            </div>
            <Button onClick={sendMonthlyReport} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send report now
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "logs" && (
        <Card>
          <CardHeader>
            <CardTitle>Recent emails</CardTitle>
            <CardDescription>Last 50 sent or attempted emails</CardDescription>
          </CardHeader>
          <CardContent>
            {emailLogs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No emails logged yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{formatDate(log.createdAt)}</TableCell>
                      <TableCell className="text-sm">{log.toEmail}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{log.subject}</TableCell>
                      <TableCell className="text-xs">{log.emailType}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === "SENT"
                              ? "default"
                              : log.status === "FAILED"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {log.status}
                        </Badge>
                        {log.error && (
                          <p className="mt-1 max-w-[180px] truncate text-[10px] text-muted-foreground" title={log.error}>
                            {log.error}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
