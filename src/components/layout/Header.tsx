"use client";

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
import { Bell, LogOut, User, ChevronDown, ClipboardList, Menu } from "lucide-react";
import { clearTokenCache } from "@/lib/api";
import { useNav } from "./NavContext";
import { canApprove } from "@/lib/permissions";

const roleLabels: Record<string, string> = {
  SALES_MARKETING: "Sales & Marketing",
  MANAGEMENT_ADMIN: "Management / Admin",
  PRODUCTION_LOGISTICS: "Production & Logistics",
  ACCOUNT: "Accounts & Finance",
};

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const { toggleMobile } = useNav();
  const isAdmin = canApprove(user?.role);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = () => {
    clearTokenCache();
    signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="app-header flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 shadow-sm sm:h-16 sm:px-6 print:hidden">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={toggleMobile}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-lg">
            Welcome back, {user?.name?.split(" ")[0]}
          </h2>
          {user?.zoneName && (
            <span className="hidden w-fit rounded-md border border-border bg-muted/80 px-2 py-0.5 text-xs font-medium sm:inline-flex">
              {user.zoneName} Zone
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/approvals" className="flex cursor-pointer items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-brand-600" />
                  <span>Review pending approvals</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-lg px-2">
              <Avatar className="h-8 w-8 border border-border sm:h-9 sm:w-9">
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
              onClick={handleSignOut}
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
