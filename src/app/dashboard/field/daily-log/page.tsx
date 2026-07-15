"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Loader2, MapPin } from "lucide-react";
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
    kilometersTraveled: "",
    expensesSummary: "",
  });

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
          kilometersTraveled: form.kilometersTraveled ? parseFloat(form.kilometersTraveled) : null,
          expensesSummary: form.expensesSummary || null,
          odometerPhoto,
          latitude: location?.lat,
          longitude: location?.lng,
          locationLabel: location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : null,
        }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/dashboard/field"), 1500);
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
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
        <h2 className="mt-4 text-2xl font-bold">Saved!</h2>
        <p className="text-muted-foreground">Your daily log was submitted.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/field">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Daily work log</h1>
          <p className="text-sm text-muted-foreground">Today — {new Date().toLocaleDateString("en-IN")}</p>
        </div>
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
            <div className="space-y-2">
              <Label htmlFor="km">Kilometers traveled *</Label>
              <Input id="km" type="number" min={0} step="0.1" required className="h-12 text-lg" placeholder="Enter KM from odometer" value={form.kilometersTraveled} onChange={(e) => setForm({ ...form, kilometersTraveled: e.target.value })} />
            </div>
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
