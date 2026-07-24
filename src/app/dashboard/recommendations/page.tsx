"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Leaf, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Recommendation {
  id: string;
  activityType?: string;
  farmerName: string;
  contactNumber: string;
  cropType: string;
  issueType: string;
  districtName: string;
  followUpRequired: boolean;
  followUpDate: string | null;
  createdAt: string;
  user: { fullName: string };
  products: { product: { name: string } }[];
}

const issueTypeLabels: Record<string, { label: string; color: string }> = {
  TECHNICAL: { label: "Technical", color: "bg-blue-100 text-blue-800" },
  NUTRITIONAL: { label: "Nutritional", color: "bg-green-100 text-green-800" },
  PEST_DISEASE: { label: "Pest/Disease", color: "bg-red-100 text-red-800" },
  GENERAL: { label: "General", color: "bg-gray-100 text-gray-800" },
};

const activityTypeLabels: Record<string, { label: string; color: string }> = {
  RECOMMENDATION: { label: "Recommendation", color: "bg-emerald-100 text-emerald-800" },
  FIELD_WORK: { label: "Field Work", color: "bg-amber-100 text-amber-800" },
  DEMO: { label: "Demo", color: "bg-indigo-100 text-indigo-800" },
  FARMER_MEETING: { label: "Farmer Meeting", color: "bg-purple-100 text-purple-800" },
  CAMPAIGN: { label: "Campaign", color: "bg-pink-100 text-pink-800" },
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await apiFetch("/api/recommendations");
      const data = await res.json();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = recommendations.filter(
    (rec) =>
      rec.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      rec.cropType.toLowerCase().includes(search.toLowerCase()) ||
      rec.districtName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Promotion Activity</h1>
          <p className="text-muted-foreground">
            Field work, recommendations, demos, farmer meetings and campaigns
          </p>
        </div>
        <Link href="/dashboard/recommendations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Activity
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by farmer, crop, or district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="text-center py-8">
              <Leaf className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No recommendations found</p>
              <Link href="/dashboard/recommendations/new">
                <Button className="mt-4">Create Your First Recommendation</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Farmer Name</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Products Recommended</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecommendations.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>{formatDate(rec.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          activityTypeLabels[rec.activityType || "RECOMMENDATION"]?.color || ""
                        }
                      >
                        {activityTypeLabels[rec.activityType || "RECOMMENDATION"]?.label ||
                          rec.activityType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rec.farmerName}</p>
                        <p className="text-xs text-muted-foreground">{rec.contactNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>{rec.cropType}</TableCell>
                    <TableCell>
                      <Badge className={issueTypeLabels[rec.issueType]?.color || ""}>
                        {issueTypeLabels[rec.issueType]?.label || rec.issueType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rec.products.slice(0, 2).map((p, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {p.product.name}
                          </Badge>
                        ))}
                        {rec.products.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{rec.products.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{rec.districtName}</TableCell>
                    <TableCell>
                      {rec.followUpRequired ? (
                        <Badge variant="warning">
                          {rec.followUpDate ? formatDate(rec.followUpDate) : "Required"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>{rec.user.fullName}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/recommendations/${rec.id}`} title="View details">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
