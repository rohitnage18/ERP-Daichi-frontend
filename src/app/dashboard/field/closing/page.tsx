"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiFetch, apiFetchJsonArray } from "@/lib/api";
import { ListEditor } from "@/components/field/ListEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DealerOption {
  id: string;
  firmName: string;
}

export default function DailyClosingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [done, setDone] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [alreadyClosed, setAlreadyClosed] = useState(false);
  const [openingOdometer, setOpeningOdometer] = useState<number | null>(null);
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [placesVisited, setPlacesVisited] = useState<string[]>([""]);
  const [dealerIds, setDealerIds] = useState<string[]>([]);
  const [salesAchievement, setSalesAchievement] = useState("");
  const [collectionAchievement, setCollectionAchievement] = useState("");
  const [closingOdometer, setClosingOdometer] = useState("");
  const [newDealerId, setNewDealerId] = useState("");
  const [newDealerDetails, setNewDealerDetails] = useState("");
  const [farmers, setFarmers] = useState([{ name: "", location: "", notes: "" }]);
  const [otherWork, setOtherWork] = useState("");
  const [dcrId, setDcrId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/daily-reports/today").then((r) => r.json()),
      apiFetchJsonArray<{ id?: string; _id?: string; firmName?: string }>("/api/daichi-dealers"),
    ])
      .then(([today, dealerList]) => {
        setDealers(
          dealerList.map((d) => ({ id: d.id || d._id || "", firmName: d.firmName || "" }))
        );
        if (!today?.hasActivity) {
          setBlockMessage("Submit today's Daily Activity Report first.");
          return;
        }
        if (today.hasClosing) {
          setAlreadyClosed(true);
          setDcrId(today.dcrId || null);
          return;
        }
        setOpeningOdometer(today.activity?.openingOdometer ?? null);
        setPlacesVisited(today.activity?.placesToVisit?.length ? today.activity.placesToVisit : [""]);
      })
      .finally(() => setBooting(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dealersVisited = dealerIds
        .map((id) => dealers.find((d) => d.id === id))
        .filter(Boolean)
        .map((d) => ({ dealerId: d!.id, dealerName: d!.firmName }));
      const res = await apiFetch("/api/daily-reports/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closingOdometer: Number(closingOdometer),
          placesVisited,
          dealersVisited,
          salesAchievement: Number(salesAchievement),
          collectionAchievement: Number(collectionAchievement),
          newDealerAppointment: {
            dealerId: newDealerId || undefined,
            dealerName: dealers.find((d) => d.id === newDealerId)?.firmName,
            details: newDealerDetails,
          },
          farmersVisited: farmers.filter((f) => f.name.trim()),
          otherWork,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDcrId(data.dcrId || null);
        setDone(true);
        setTimeout(() => router.push("/dashboard/field/history"), 1100);
      } else {
        alert(data.error || "Could not save Daily Closing Report.");
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
        <h2 className="mt-4 text-2xl font-bold">Day closed & locked</h2>
        <p className="text-muted-foreground">Closing report saved{dcrId ? ` (${dcrId})` : ""}.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Daily Closing Report</h1>
        <p className="text-sm text-muted-foreground">Actual work for {new Date().toLocaleDateString("en-IN")}</p>
      </div>

      {blockMessage && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="font-medium">{blockMessage}</p>
            <Button className="w-full" onClick={() => router.push("/dashboard/field/activity")}>
              Open Daily Activity Report
            </Button>
          </CardContent>
        </Card>
      )}

      {alreadyClosed && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            {dcrId && <p className="font-medium text-foreground">DCR ID: {dcrId}</p>}
            <p>
              Today&apos;s closing report is already submitted and locked. Historical records are kept and cannot be
              submitted twice.
            </p>
          </CardContent>
        </Card>
      )}

      {!blockMessage && !alreadyClosed && (
        <form onSubmit={submit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">End-of-day actuals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="closingOdometer">Closing odometer *</Label>
                <Input id="closingOdometer" type="number" min={openingOdometer ?? 0} step="0.1" required className="h-12 text-lg" value={closingOdometer} onChange={(e) => setClosingOdometer(e.target.value)} />
                {openingOdometer != null && (
                  <p className="text-xs text-muted-foreground">Opening reading today: {openingOdometer}</p>
                )}
              </div>
              <ListEditor label="Places visited *" values={placesVisited} onChange={setPlacesVisited} placeholder="Place visited" />
              <div className="space-y-2">
                <Label>Dealers visited</Label>
                <Select
                  value=""
                  onValueChange={(id) => {
                    if (!dealerIds.includes(id)) setDealerIds([...dealerIds, id]);
                  }}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Add a dealer from master" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.firmName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {dealerIds.map((id) => (
                    <button
                      type="button"
                      key={id}
                      className="rounded-full border px-3 py-1 text-xs"
                      onClick={() => setDealerIds(dealerIds.filter((x) => x !== id))}
                    >
                      {dealers.find((d) => d.id === id)?.firmName || id} ×
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sales achievement (₹) *</Label>
                  <Input type="number" min={0} required className="h-12 text-lg" value={salesAchievement} onChange={(e) => setSalesAchievement(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Collection achievement (₹) *</Label>
                  <Input type="number" min={0} required className="h-12 text-lg" value={collectionAchievement} onChange={(e) => setCollectionAchievement(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>New dealer appointment</Label>
                <Select value={newDealerId || "none"} onValueChange={(v) => setNewDealerId(v === "none" ? "" : v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Link dealer if onboarded" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {dealers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.firmName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea rows={2} placeholder="Details of any new dealer onboarded" value={newDealerDetails} onChange={(e) => setNewDealerDetails(e.target.value)} />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">Farmer visit details</p>
                {farmers.map((f, i) => (
                  <div key={i} className="space-y-2 rounded-md border p-3">
                    <Input placeholder="Farmer name" className="h-11" value={f.name} onChange={(e) => setFarmers(farmers.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row)))} />
                    <Input placeholder="Location" className="h-11" value={f.location} onChange={(e) => setFarmers(farmers.map((row, idx) => (idx === i ? { ...row, location: e.target.value } : row)))} />
                    <Textarea rows={2} placeholder="Discussion notes" value={f.notes} onChange={(e) => setFarmers(farmers.map((row, idx) => (idx === i ? { ...row, notes: e.target.value } : row)))} />
                  </div>
                ))}
                <Button type="button" variant="outline" className="w-full" onClick={() => setFarmers([...farmers, { name: "", location: "", notes: "" }])}>
                  Add farmer visit
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Any other specific work done</Label>
                <Textarea rows={3} value={otherWork} onChange={(e) => setOtherWork(e.target.value)} />
              </div>
              <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Submit closing report
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
