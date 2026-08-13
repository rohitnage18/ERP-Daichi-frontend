"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, apiFetchJsonArray } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin } from "lucide-react";
import { PhotoCaptureField } from "@/components/shared/PhotoCaptureField";

interface DealerOption {
  id: string;
  firmName: string;
  city: string;
}

export default function NewVisitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null);
  const [form, setForm] = useState({
    dealerId: "",
    prospectName: "",
    purpose: "ORDER_FOLLOWUP",
    personsMet: "",
    discussionNotes: "",
    nextAction: "",
  });

  useEffect(() => {
    apiFetchJsonArray<{ id?: string; _id?: string; firmName?: string; city?: string }>(
      "/api/daichi-dealers"
    ).then((d) =>
      setDealers(
        d.map((dealer) => ({
          id: dealer.id || dealer._id || "",
          firmName: dealer.firmName || "",
          city: dealer.city || "",
        }))
      )
    );
  }, []);

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
        alert("Could not get location. Allow GPS or enter visit without map.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedDealer = dealers.find((d) => d.id === form.dealerId);
      const res = await apiFetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: form.dealerId || null,
          dealerName: selectedDealer?.firmName || null,
          prospectName: form.prospectName || null,
          purpose: form.purpose,
          personsMet: form.personsMet,
          discussionNotes: form.discussionNotes,
          nextAction: form.nextAction || null,
          visitDate: new Date().toISOString(),
          latitude: location?.lat,
          longitude: location?.lng,
          locationLabel: location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : null,
          odometerPhoto,
        }),
      });
      if (res.ok) router.push("/dashboard/field/history");
      else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not save visit.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      <h1 className="text-xl sm:text-2xl font-bold">Record dealer visit</h1>

      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visit details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Dealer (if registered)</Label>
              <Select value={form.dealerId} onValueChange={(v) => setForm({ ...form, dealerId: v })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select dealer or leave blank" />
                </SelectTrigger>
                <SelectContent>
                  {dealers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.firmName} — {d.city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!form.dealerId && (
              <div className="space-y-2">
                <Label htmlFor="prospect">Prospect name</Label>
                <Input id="prospect" className="h-12" value={form.prospectName} onChange={(e) => setForm({ ...form, prospectName: e.target.value })} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Select value={form.purpose} onValueChange={(v) => setForm({ ...form, purpose: v })}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORDER_FOLLOWUP">Order follow-up</SelectItem>
                  <SelectItem value="NEW_DEALER">New dealer enquiry</SelectItem>
                  <SelectItem value="COLLECTION">Payment collection</SelectItem>
                  <SelectItem value="PRODUCT_DEMO">Product demo</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="met">Person met *</Label>
              <Input id="met" required className="h-12" value={form.personsMet} onChange={(e) => setForm({ ...form, personsMet: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Discussion *</Label>
              <Textarea id="notes" required rows={3} className="min-h-[80px]" value={form.discussionNotes} onChange={(e) => setForm({ ...form, discussionNotes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next">Next action</Label>
              <Input id="next" className="h-12" value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} />
            </div>
            <PhotoCaptureField
              label="Site / odometer photo"
              hint="Optional — take a site photo or odometer reading for verification"
              value={odometerPhoto}
              onChange={setOdometerPhoto}
            />
            <Button type="button" variant="outline" className="h-12 w-full" onClick={captureLocation} disabled={locating}>
              <MapPin className="mr-2 h-5 w-5" />
              {location ? "Location captured ✓" : locating ? "Getting GPS..." : "Capture my location"}
            </Button>
            <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Save visit
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
