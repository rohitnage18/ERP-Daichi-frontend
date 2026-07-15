"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export default function SystemSettingsPage() {
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic company details used in invoices and reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input defaultValue="Xenvolt Agri Products" />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input defaultValue="27AABCX1234R1ZM" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Address</Label>
                <Input defaultValue="123 Industrial Area, Pune, Maharashtra - 411001" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
            <CardDescription>Configure invoice generation settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Prefix</Label>
                <Input defaultValue="XV/INV" />
              </div>
              <div className="space-y-2">
                <Label>Next Invoice Number</Label>
                <Input defaultValue="00002" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit Settings</CardTitle>
            <CardDescription>Default credit period and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Credit Period</Label>
                <Input defaultValue="45 Days" />
              </div>
              <div className="space-y-2">
                <Label>Default Credit Limit</Label>
                <Input defaultValue="300000" />
              </div>
            </div>
          </CardContent>
        </Card>

        {savedMsg && (
          <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
            {savedMsg}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => {
              setSavedMsg("Settings saved locally for this session. Connect to an API to persist company profile.");
              setTimeout(() => setSavedMsg(null), 5000);
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
