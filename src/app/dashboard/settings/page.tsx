"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Package, Settings2, Mail } from "lucide-react";
import Link from "next/link";

const settingsItems = [
  {
    title: "Email & invitations",
    description: "Invite staff and send monthly management reports",
    icon: Mail,
    href: "/dashboard/settings/email",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    title: "User Management",
    description: "View team and invite new users",
    icon: Users,
    href: "/dashboard/settings/users",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Zone & Districts",
    description: "Manage geographic zones and district mapping",
    icon: MapPin,
    href: "/dashboard/settings/zones",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Product Categories",
    description: "Manage product categories and sub-categories",
    icon: Package,
    href: "/dashboard/settings/categories",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "System Settings",
    description: "Configure system-wide settings",
    icon: Settings2,
    href: "/dashboard/settings/system",
    color: "bg-orange-100 text-orange-600",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and manage master data
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsItems.map((item) => (
          <Card key={item.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={item.href}>
                <Button variant="outline" className="w-full">
                  Manage
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
