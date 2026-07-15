"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, User, ChevronDown, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
const roleLabels: Record<string, string> = {
  SALES_MARKETING: "Sales & Marketing",
  MANAGEMENT_ADMIN: "Management / Admin",
  PRODUCTION_LOGISTICS: "Production & Logistics",
  ACCOUNT: "Accounts & Finance",
};

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const [notifOpen, setNotifOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="app-header flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm sm:px-6 print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Welcome back, {user?.name?.split(" ")[0]}
          </h2>
          {user?.zoneName && (
            <Badge variant="secondary" className="w-fit border border-border bg-muted/80 font-medium">
              {user.zoneName} Zone
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-semibold text-destructive-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild onClick={() => setNotifOpen(false)}>
              <Link href="/dashboard/approvals" className="flex cursor-pointer items-center gap-2">
                <ClipboardList className="h-4 w-4 text-brand-600" />
                <span>Pending approvals need your attention</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={() => setNotifOpen(false)}>
              <Link href="/dashboard/logistics" className="cursor-pointer">
                Orders ready for dispatch
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={() => setNotifOpen(false)}>
              <Link href="/dashboard/finance/invoices" className="cursor-pointer">
                Invoices due for follow-up
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-lg px-2">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-brand-600 text-sm font-semibold text-primary-foreground">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold leading-none">{user?.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {user?.role ? roleLabels[user.role] : ""}
                </p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/profile" className="flex cursor-pointer items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
