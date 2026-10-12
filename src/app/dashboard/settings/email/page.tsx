"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail } from "lucide-react";

const REPORTS = [
  { id: "monthly", label: "Monthly report" },
  { id: "sales", label: "Sales report" },
  { id: "aging", label: "Aging report" },
  { id: "products", label: "Product report" },
  { id: "dealers", label: "Dealer report" },
];

export default function EmailSettingsPage() {
  const [to, setTo] = useState("");
  const [report, setReport] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"ok" | "error">("ok");

  useEffect(() => {
    apiFetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const saved = typeof data?.management_report_emails === "string" ? data.management_report_emails : "";
        const first = saved.split(",")[0]?.trim() || "";
        if (first) setTo(first);
      })
      .catch(() => undefined);
  }, []);

  const sendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch("/api/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, to: to.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessageKind("ok");
        setMessage(`${REPORTS.find((item) => item.id === report)?.label || "Report"} sent to ${data.to || to}.`);
      } else {
        setMessageKind("error");
        setMessage(data.error || "The report was not sent.");
      }
    } catch {
      setMessageKind("error");
      setMessage("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Send report</h1>
        <p className="text-muted-foreground">Email a report to the founder</p>
      </div>

      {message && (
        <div
          className={
            messageKind === "error"
              ? "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              : "rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm"
          }
        >
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Founder email</CardTitle>
          <CardDescription>Choose the report and send it to this address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendReport} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="founder@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Report</Label>
              <Select value={report} onValueChange={setReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORTS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send report
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
