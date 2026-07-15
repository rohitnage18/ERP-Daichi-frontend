"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { PhotoCaptureField } from "@/components/shared/PhotoCaptureField";

export default function NewAllowancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null);
  const [form, setForm] = useState({
    claimType: "TRAVEL",
    amount: "",
    description: "",
    kilometers: "",
    receiptNote: "",
  });

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("Location not supported.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        alert("Could not get location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/allowances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimDate: new Date().toISOString(),
          claimType: form.claimType,
          amount: parseFloat(form.amount),
          description: form.description,
          kilometers: form.kilometers ? parseFloat(form.kilometers) : null,
          receiptNote: form.receiptNote || null,
          odometerPhoto,
          latitude: location?.lat,
          longitude: location?.lng,
          locationLabel: location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : null,
        }),
      });
      if (res.ok) router.push("/dashboard/field/history");
      else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not submit claim.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/field">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">Allowance claim</h1>
      </div>

      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Claim details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.claimType} onValueChange={(v) => setForm({ ...form, claimType: v })}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRAVEL">Travel / fuel</SelectItem>
                  <SelectItem value="DA">Daily allowance (DA)</SelectItem>
                  <SelectItem value="FOOD">Food</SelectItem>
                  <SelectItem value="LODGING">Lodging</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input id="amount" type="number" required min={1} step="1" className="h-12 text-lg" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km">Kilometers (if travel) *</Label>
              <Input id="km" type="number" min={0} required className="h-12" value={form.kilometers} onChange={(e) => setForm({ ...form, kilometers: e.target.value })} />
            </div>
            <PhotoCaptureField
              label="Odometer / receipt photo"
              hint="Take a photo of odometer or receipt, or upload from gallery"
              value={odometerPhoto}
              onChange={setOdometerPhoto}
            />
            <Button type="button" variant="outline" className="h-12 w-full" onClick={captureLocation} disabled={locating}>
              <MapPin className="mr-2 h-5 w-5" />
              {location ? "Location captured ✓" : locating ? "Getting GPS..." : "Capture my location"}
            </Button>
            <div className="space-y-2">
              <Label htmlFor="desc">Description *</Label>
              <Textarea id="desc" required rows={3} placeholder="Where you went and why..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt / reference</Label>
              <Input id="receipt" className="h-12" placeholder="Bill number or note" value={form.receiptNote} onChange={(e) => setForm({ ...form, receiptNote: e.target.value })} />
            </div>
            <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Submit for approval
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
