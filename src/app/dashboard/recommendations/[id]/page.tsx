"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

const issueLabels: Record<string, string> = {
  TECHNICAL: "Technical",
  NUTRITIONAL: "Nutritional",
  PEST_DISEASE: "Pest / disease",
  GENERAL: "General",
};

export default function RecommendationDetailPage() {
  const params = useParams();
  const [rec, setRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`/api/recommendations/${params.id}`);
        if (res.ok) setRec(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!rec) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Recommendation not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
          <h1 className="text-2xl font-bold tracking-tight">Farmer recommendation</h1>
          <p className="text-sm text-muted-foreground">{formatDate(rec.createdAt)}</p>
        </div>

      <Card className="border-border/80 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Farmer / contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span>{" "}
            <span className="font-medium">{rec.farmerName}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Phone:</span> {rec.contactNumber}
          </p>
          <p>
            <span className="text-muted-foreground">Location:</span>{" "}
            {[rec.village, rec.taluka, rec.districtName].filter(Boolean).join(", ")}
          </p>
          <p>
            <span className="text-muted-foreground">Crop:</span> {rec.cropType}
          </p>
          <p>
            <span className="text-muted-foreground">By:</span> {rec.user.fullName}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant="outline">{issueLabels[rec.issueType] || rec.issueType}</Badge>
          <p className="text-sm leading-relaxed">{rec.issueDescription}</p>
          {rec.symptomsObserved && (
            <>
              <Separator />
              <p className="text-xs font-semibold uppercase text-muted-foreground">Symptoms</p>
              <p className="text-sm">{rec.symptomsObserved}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="leading-relaxed">{rec.recommendationText}</p>
          {rec.dosageApplication && (
            <p>
              <span className="font-semibold text-foreground">Dosage:</span> {rec.dosageApplication}
            </p>
          )}
          {rec.expectedOutcome && (
            <p>
              <span className="font-semibold text-foreground">Expected outcome:</span> {rec.expectedOutcome}
            </p>
          )}
          <Separator />
          <p className="text-xs font-semibold uppercase text-muted-foreground">Products</p>
          <ul className="list-inside list-disc space-y-1">
            {rec.products.map((p: any) => (
              <li key={p.productId}>
                <span className="font-medium">{p.product.name}</span> — {p.reason}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
