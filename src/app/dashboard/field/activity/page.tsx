"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ListEditor } from "@/components/field/ListEditor";
import { dateKeyIST } from "@/lib/dates-ist";

export default function DailyActivityPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "MANAGEMENT_ADMIN";
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [done, setDone] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [reportDate, setReportDate] = useState(dateKeyIST());
  const [placesToVisit, setPlacesToVisit] = useState<string[]>([""]);
  const [salesTarget, setSalesTarget] = useState("");
  const [collectionTarget, setCollectionTarget] = useState("");
  const [newDealerPlan, setNewDealerPlan] = useState<string[]>([""]);
  const [demoPlan, setDemoPlan] = useState<string[]>([""]);
  const [farmerPlan, setFarmerPlan] = useState<string[]>([""]);
  const [openingOdometer, setOpeningOdometer] = useState("");

  useEffect(() => {
    apiFetch("/api/daily-reports/today")
      .then((r) => r.json())
      .then((d) => {
        if (d?.activity) {
          setExistingId(d.id);
          setPlacesToVisit(d.activity.placesToVisit?.length ? d.activity.placesToVisit : [""]);
          setSalesTarget(String(d.activity.salesTarget ?? ""));
          setCollectionTarget(String(d.activity.collectionTarget ?? ""));
          setNewDealerPlan(d.activity.newDealerAppointmentPlan?.length ? d.activity.newDealerAppointmentPlan : [""]);
          setDemoPlan(d.activity.demonstrationPlan?.length ? d.activity.demonstrationPlan : [""]);
          setFarmerPlan(d.activity.farmerMeetingPlan?.length ? d.activity.farmerMeetingPlan : [""]);
          setOpeningOdometer(d.activity.openingOdometer != null ? String(d.activity.openingOdometer) : "");
        }
        if (d?.closing) setClosed(true);
      })
      .finally(() => setBooting(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/daily-reports/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate,
          placesToVisit,
          salesTarget: Number(salesTarget),
          collectionTarget: Number(collectionTarget),
          newDealerAppointmentPlan: newDealerPlan,
          demonstrationPlan: demoPlan,
          farmerMeetingPlan: farmerPlan,
          openingOdometer: openingOdometer ? Number(openingOdometer) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/dashboard/field"), 1100);
      } else {
        alert(data.error || "Could not save Daily Activity Report.");
      }
    } catch {
      alert("Network error. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  if (booting) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
        <h2 className="mt-4 text-2xl font-bold">{existingId ? "Updated" : "Submitted"}</h2>
        <p className="text-muted-foreground">Daily Activity Report saved.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Daily Activity Report</h1>
        <p className="text-sm text-muted-foreground">Plan for the day — {new Date().toLocaleDateString("en-IN")}</p>
      </div>

      {closed ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Today is already closed. Historical reports stay in My history / team reports and cannot be overwritten.
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={submit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {existingId ? "Update today's plan" : "Start-of-day plan"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {existingId && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                  A report already exists for today. Saving will update the plan (not create a second one).
                </p>
              )}
              {isAdmin && (
                <div className="space-y-2">
                  <Label>Report date</Label>
                  <Input type="date" className="h-12" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                </div>
              )}
              <ListEditor label="Places to be visited *" values={placesToVisit} onChange={setPlacesToVisit} placeholder="Town / market / village" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salesTarget">Sales target (₹) *</Label>
                  <Input id="salesTarget" type="number" min={0} required className="h-12 text-lg" value={salesTarget} onChange={(e) => setSalesTarget(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collectionTarget">Collection target (₹) *</Label>
                  <Input id="collectionTarget" type="number" min={0} required className="h-12 text-lg" value={collectionTarget} onChange={(e) => setCollectionTarget(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="openingOdometer">Opening odometer</Label>
                <Input id="openingOdometer" type="number" min={0} step="0.1" className="h-12 text-lg" value={openingOdometer} onChange={(e) => setOpeningOdometer(e.target.value)} />
              </div>
              <ListEditor label="New dealer appointment plan" values={newDealerPlan} onChange={setNewDealerPlan} placeholder="Who / where" />
              <ListEditor label="Demonstration plan" values={demoPlan} onChange={setDemoPlan} placeholder="Product demo details" />
              <ListEditor label="Farmer meeting plan" values={farmerPlan} onChange={setFarmerPlan} placeholder="Meeting place / agenda" />
              <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {existingId ? "Update plan" : "Submit plan"}
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
