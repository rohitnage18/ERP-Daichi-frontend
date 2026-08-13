"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  productCode: string;
}

export default function NewRecommendationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; reason: string }[]>([]);
  const [formData, setFormData] = useState({
    activityType: "RECOMMENDATION",
    farmerName: "",
    contactNumber: "",
    village: "",
    taluka: "",
    districtName: "",
    cropType: "",
    landSize: "",
    issueType: "",
    issueDescription: "",
    symptomsObserved: "",
    recommendationText: "",
    dosageApplication: "",
    expectedOutcome: "",
    followUpRequired: false,
    followUpDate: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiFetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const addProduct = (productId: string) => {
    if (!selectedProducts.find((p) => p.productId === productId)) {
      setSelectedProducts([...selectedProducts, { productId, reason: "" }]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productId !== productId));
  };

  const updateProductReason = (productId: string, reason: string) => {
    setSelectedProducts(
      selectedProducts.map((p) => (p.productId === productId ? { ...p, reason } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          landSize: formData.landSize ? parseFloat(formData.landSize) : null,
          landUnit: "Acres",
          products: selectedProducts,
        }),
      });
      if (res.ok) {
        router.push("/dashboard/recommendations");
      }
    } catch (error) {
      console.error("Error creating recommendation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-3xl font-bold">New Sales Promotion Activity</h1>
          <p className="text-muted-foreground">
            Log a recommendation, field work, demo, farmer meeting or campaign
          </p>
        </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity Type</CardTitle>
              <CardDescription>What kind of sales promotion activity is this?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-sm">
                <Label>Activity Type *</Label>
                <Select
                  value={formData.activityType}
                  onValueChange={(value) => setFormData({ ...formData, activityType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECOMMENDATION">Recommendation</SelectItem>
                    <SelectItem value="FIELD_WORK">Field Work</SelectItem>
                    <SelectItem value="DEMO">Demo</SelectItem>
                    <SelectItem value="FARMER_MEETING">Farmer Meeting</SelectItem>
                    <SelectItem value="CAMPAIGN">Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Farmer/Shopkeeper Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.farmerName}
                    onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                    placeholder="Farmer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number *</Label>
                  <Input
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="9876543210"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Village</Label>
                  <Input
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    placeholder="Village name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taluka</Label>
                  <Input
                    value={formData.taluka}
                    onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                    placeholder="Taluka name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>District *</Label>
                  <Input
                    value={formData.districtName}
                    onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                    placeholder="District name"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crop & Land Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Crop Type *</Label>
                  <Input
                    value={formData.cropType}
                    onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                    placeholder="e.g., Tomato, Cotton"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Land Size (Acres)</Label>
                  <Input
                    type="number"
                    value={formData.landSize}
                    onChange={(e) => setFormData({ ...formData, landSize: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Issue Type *</Label>
                <Select
                  value={formData.issueType}
                  onValueChange={(value) => setFormData({ ...formData, issueType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                    <SelectItem value="NUTRITIONAL">Nutritional Deficiency</SelectItem>
                    <SelectItem value="PEST_DISEASE">Pest/Disease</SelectItem>
                    <SelectItem value="GENERAL">General Advisory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Issue Description</Label>
                <Textarea
                  value={formData.issueDescription}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                  placeholder="Describe the issue in detail..."
                />
              </div>
              <div className="space-y-2">
                <Label>Symptoms Observed</Label>
                <Textarea
                  value={formData.symptomsObserved}
                  onChange={(e) => setFormData({ ...formData, symptomsObserved: e.target.value })}
                  placeholder="Visual symptoms, plant condition..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Recommendation / Notes</Label>
                <Textarea
                  value={formData.recommendationText}
                  onChange={(e) => setFormData({ ...formData, recommendationText: e.target.value })}
                  placeholder="Your recommendation or activity notes..."
                />
              </div>
              <div className="space-y-2">
                <Label>Dosage & Application</Label>
                <Input
                  value={formData.dosageApplication}
                  onChange={(e) => setFormData({ ...formData, dosageApplication: e.target.value })}
                  placeholder="e.g., 2ml per liter, spray every 7 days"
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Outcome</Label>
                <Input
                  value={formData.expectedOutcome}
                  onChange={(e) => setFormData({ ...formData, expectedOutcome: e.target.value })}
                  placeholder="Expected results"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recommended Products</CardTitle>
              <CardDescription>Select products to recommend</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select onValueChange={addProduct}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.productCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedProducts.length > 0 && (
                <div className="space-y-3">
                  {selectedProducts.map((sp) => {
                    const product = products.find((p) => p.id === sp.productId);
                    return (
                      <div key={sp.productId} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge>{product?.name}</Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => removeProduct(sp.productId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <Input
                            className="mt-2"
                            placeholder="Reason for recommending this product..."
                            value={sp.reason}
                            onChange={(e) => updateProductReason(sp.productId, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Recommendation
          </Button>
        </div>
      </form>
    </div>
  );
}
