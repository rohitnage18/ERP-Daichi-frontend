"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, apiFetchJsonArray, asArray } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Save, Send } from "lucide-react";
import Link from "next/link";

interface Zone {
  id: string;
  name: string;
  districts: District[];
}

interface District {
  id: string;
  name: string;
}

export default function NewDealerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);

  const [formData, setFormData] = useState({
    firmName: "",
    proprietorName: "",
    contactNumber: "",
    alternateContact: "",
    email: "",
    gstNumber: "",
    panNumber: "",
    aadharNumber: "",
    businessAddress: "",
    city: "",
    districtId: "",
    pinCode: "",
    bankName: "",
    bankAccountNumber: "",
    ifscCode: "",
    yearsInBusiness: "",
    annualTurnover: "",
    creditPeriod: "DAYS_45",
    existingBrands: "",
    godownAvailable: false,
    godownSize: "",
    vehicleAvailable: false,
    referenceName: "",
    referenceContact: "",
  });

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    const data = await apiFetchJsonArray<Zone>("/api/zones");
    setZones(data);
  };

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId);
    const zone = zones.find((z) => z.id === zoneId);
    setDistricts(asArray<District>(zone?.districts));
    setFormData({ ...formData, districtId: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (action: "draft" | "submit") => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/dealers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          yearsInBusiness: parseInt(formData.yearsInBusiness) || 0,
          godownSize: formData.godownSize ? parseInt(formData.godownSize) : null,
          status: action === "submit" ? "SUBMITTED" : "DRAFT",
        }),
      });

      if (res.ok) {
        router.push("/dashboard/dealers");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to create dealer");
      }
    } catch (error) {
      console.error("Error creating dealer:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/dealers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Dealer Registration</h1>
          <p className="text-muted-foreground">
            Fill in dealer details to create a new registration
          </p>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="tax">Tax & Bank</TabsTrigger>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the dealer's basic contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firmName">Firm Name *</Label>
                  <Input
                    id="firmName"
                    name="firmName"
                    value={formData.firmName}
                    onChange={handleChange}
                    placeholder="Enter firm name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proprietorName">Proprietor Name *</Label>
                  <Input
                    id="proprietorName"
                    name="proprietorName"
                    value={formData.proprietorName}
                    onChange={handleChange}
                    placeholder="Enter proprietor name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternateContact">Alternate Contact</Label>
                  <Input
                    id="alternateContact"
                    name="alternateContact"
                    value={formData.alternateContact}
                    onChange={handleChange}
                    placeholder="Alternate contact number"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax & Bank Details</CardTitle>
              <CardDescription>Enter GST, PAN, and bank account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number *</Label>
                  <Input
                    id="gstNumber"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="15-character GSTIN"
                    maxLength={15}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    placeholder="10-character PAN"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadharNumber">Aadhar Number</Label>
                  <Input
                    id="aadharNumber"
                    name="aadharNumber"
                    value={formData.aadharNumber}
                    onChange={handleChange}
                    placeholder="12-digit Aadhar"
                    maxLength={12}
                  />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-4">Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="Enter bank name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">Account Number *</Label>
                    <Input
                      id="bankAccountNumber"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={handleChange}
                      placeholder="Enter account number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code *</Label>
                    <Input
                      id="ifscCode"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      placeholder="11-character IFSC"
                      maxLength={11}
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Enter address and business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Textarea
                    id="businessAddress"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    placeholder="Enter full address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pinCode">PIN Code *</Label>
                  <Input
                    id="pinCode"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleChange}
                    placeholder="6-digit PIN"
                    maxLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zone *</Label>
                  <Select value={selectedZone} onValueChange={handleZoneChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {asArray<Zone>(zones).map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                      {zones.length === 0 && (
                        <SelectItem value="__none" disabled>
                          No zones available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>District *</Label>
                  <Select
                    value={formData.districtId}
                    onValueChange={(value) => setFormData({ ...formData, districtId: value })}
                    disabled={!selectedZone}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {asArray<District>(districts).map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsInBusiness">Years in Business *</Label>
                  <Input
                    id="yearsInBusiness"
                    name="yearsInBusiness"
                    type="number"
                    value={formData.yearsInBusiness}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Turnover *</Label>
                  <Select
                    value={formData.annualTurnover}
                    onValueChange={(value) => setFormData({ ...formData, annualTurnover: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Below 10L">Below 10 Lakhs</SelectItem>
                      <SelectItem value="10L-25L">10-25 Lakhs</SelectItem>
                      <SelectItem value="25L-50L">25-50 Lakhs</SelectItem>
                      <SelectItem value="50L-1Cr">50 Lakhs - 1 Crore</SelectItem>
                      <SelectItem value="Above 1Cr">Above 1 Crore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Credit Period *</Label>
                  <Select
                    value={formData.creditPeriod}
                    onValueChange={(value) => setFormData({ ...formData, creditPeriod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credit period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAYS_45">45 Days</SelectItem>
                      <SelectItem value="DAYS_60">60 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Upload required documents (Coming Soon)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Document upload functionality will be available in the next update.
                <br />
                You can save the dealer as draft and upload documents later.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit("submit")} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit for Approval
        </Button>
      </div>
    </div>
  );
}
