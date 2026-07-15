"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetchJsonArray, asArray } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  code: string;
  division: { name: string };
  districts: { id: string; name: string; code: string }[];
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [addHint, setAddHint] = useState<string | null>(null);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setZones(await apiFetchJsonArray<Zone>("/api/zones"));
    } catch (error) {
      console.error("Failed to fetch zones:", error);
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zones & Districts</h1>
          <p className="text-muted-foreground">Manage geographic zones and district mapping</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setAddHint("Zone master changes are admin-only in production. Contact management to add a zone.");
            setTimeout(() => setAddHint(null), 5000);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add zone
        </Button>
      </div>

      {addHint && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          {addHint}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      ) : (
        <div className="grid gap-6">
          {asArray<Zone>(zones).map((zone) => (
            <Card key={zone.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
                      <MapPin className="h-5 w-5 text-brand-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{zone.name}</CardTitle>
                      <CardDescription>
                        {zone.division.name} Division • Code: {zone.code}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">{zone.districts.length} Districts</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>District Code</TableHead>
                      <TableHead>District Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zone.districts.map((district) => (
                      <TableRow key={district.id}>
                        <TableCell className="font-mono">{district.code}</TableCell>
                        <TableCell>{district.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
