"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PhotoCaptureField } from "@/components/shared/PhotoCaptureField";

export default function DailyLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [done, setDone] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null);
  const [form, setForm] = useState({
    summary: "",
    dealersVisited: "0",
    ordersDiscussed: "0",
    openingKm: "",
    closingKm: "",
    salesAmount: "",
    collectionAmount: "",
    newDealersAppointed: "0",
    achievementNotes: "",
    expensesSummary: "",
  });

  const distanceTraveled =
    form.openingKm !== "" && form.closingKm !== ""
      ? Math.max(0, Number(form.closingKm) - Number(form.openingKm))
      : null;

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("Location not supported on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        alert("Could not get location. Allow GPS in browser settings.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logDate: new Date().toISOString(),
          summary: form.summary,
          dealersVisited: parseInt(form.dealersVisited, 10) || 0,
          ordersDiscussed: parseInt(form.ordersDiscussed, 10) || 0,
          openingKm: form.openingKm ? parseFloat(form.openingKm) : null,
          closingKm: form.closingKm ? parseFloat(form.closingKm) : null,
          kilometersTraveled: distanceTraveled,
          salesAmount: form.salesAmount ? parseFloat(form.salesAmount) : null,
          collectionAmount: form.collectionAmount ? parseFloat(form.collectionAmount) : null,
          newDealersAppointed: parseInt(form.newDealersAppointed, 10) || 0,
          achievementNotes: form.achievementNotes || null,
          expensesSummary: form.expensesSummary || null,
          odometerPhoto,
          latitude: location?.lat,
          longitude: location?.lng,
          locationLabel: location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : null,
        }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/dashboard/field/history"), 1200);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not save. Try again.");
      }
    } catch {
      alert("Network error. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
        <h2 className="mt-4 text-2xl font-bold">Saved!</h2>
        <p className="text-muted-foreground">Opening your field history…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      <div>
          <h1 className="text-xl sm:text-2xl font-bold">Daily work log</h1>
          <p className="text-sm text-muted-foreground">Today — {new Date().toLocaleDateString("en-IN")}</p>
        </div>

      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What did you do today?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                required
                rows={4}
                className="text-base min-h-[100px]"
                placeholder="e.g. Visited 3 dealers in Pune, discussed NPK orders..."
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dealers">Dealers visited</Label>
                <Input id="dealers" type="number" min={0} className="h-12 text-lg" value={form.dealersVisited} onChange={(e) => setForm({ ...form, dealersVisited: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orders">Orders discussed</Label>
                <Input id="orders" type="number" min={0} className="h-12 text-lg" value={form.ordersDiscussed} onChange={(e) => setForm({ ...form, ordersDiscussed: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingKm">Opening KM *</Label>
                <Input id="openingKm" type="number" min={0} step="0.1" required className="h-12 text-lg" placeholder="Start reading" value={form.openingKm} onChange={(e) => setForm({ ...form, openingKm: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingKm">Closing KM *</Label>
                <Input id="closingKm" type="number" min={0} step="0.1" required className="h-12 text-lg" placeholder="End reading" value={form.closingKm} onChange={(e) => setForm({ ...form, closingKm: e.target.value })} />
              </div>
            </div>
            {distanceTraveled !== null && (
              <p className="text-sm font-medium text-brand-700">
                Distance traveled today: {distanceTraveled} km
              </p>
            )}
            <PhotoCaptureField
              label="Odometer photo (for verification)"
              hint="Take a clear photo of your odometer reading or upload from gallery"
              value={odometerPhoto}
              onChange={setOdometerPhoto}
            />
            <Button type="button" variant="outline" className="h-12 w-full" onClick={captureLocation} disabled={locating}>
              <MapPin className="mr-2 h-5 w-5" />
              {location ? "Location captured ✓" : locating ? "Getting GPS..." : "Capture my location"}
            </Button>
            <div className="space-y-4 rounded-lg border bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Daily Achievement Report</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salesAmount">Sales booked (₹)</Label>
                  <Input id="salesAmount" type="number" min={0} step="0.01" className="h-12 text-lg" placeholder="0" value={form.salesAmount} onChange={(e) => setForm({ ...form, salesAmount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collectionAmount">Collection (₹)</Label>
                  <Input id="collectionAmount" type="number" min={0} step="0.01" className="h-12 text-lg" placeholder="0" value={form.collectionAmount} onChange={(e) => setForm({ ...form, collectionAmount: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDealers">New dealers appointed</Label>
                <Input id="newDealers" type="number" min={0} className="h-12 text-lg" value={form.newDealersAppointed} onChange={(e) => setForm({ ...form, newDealersAppointed: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="achievementNotes">Achievements / highlights</Label>
                <Textarea id="achievementNotes" rows={3} className="text-base" placeholder="Key achievements, closures, targets met..." value={form.achievementNotes} onChange={(e) => setForm({ ...form, achievementNotes: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenses">Expenses (notes)</Label>
              <Input id="expenses" className="h-12 text-base" placeholder="Fuel, meals, etc." value={form.expensesSummary} onChange={(e) => setForm({ ...form, expensesSummary: e.target.value })} />
            </div>
            <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Submit today&apos;s log
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
