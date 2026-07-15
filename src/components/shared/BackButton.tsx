"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function BackButton({
  fallbackHref = "/dashboard",
  label = "Back",
  variant = "outline",
  size = "sm",
  className,
  showLabel = true,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  if (size === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleBack}
        className={className}
        aria-label={label}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn("gap-2", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {showLabel && label}
    </Button>
  );
}

/** Shown below the app header on every page except the main dashboard. */
export function HeaderBackButton() {
  const pathname = usePathname();

  if (!pathname || pathname === "/dashboard") {
    return null;
  }

  return (
    <div className="app-back-bar shrink-0 bg-card px-4 py-2 sm:px-6 print:hidden">
      <BackButton variant="outline" size="sm" label="Back" />
    </div>
  );
}
